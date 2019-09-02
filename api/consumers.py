import typing as t

import json
import threading
import time
import random
import queue

from channels.generic.websocket import WebsocketConsumer, JsonWebsocketConsumer

from api import models
from evolution import model
from evolution.logging import LogFrame

from api.services import DISTRIBUTOR_SERVICE
from magiccube.collections.cube import Cube
from magiccube.collections.nodecollection import NodeCollection
from magiccube.laps.traps.distribute import algorithm
from magiccube.laps.traps.distribute.algorithm import Distributor
from magiccube.laps.traps.distribute.distribute import DistributionTask
from magiccube.update.cubeupdate import CubePatch, CubeUpdater
from mtgorp.models.serilization.strategies.jsonid import JsonId
from resources.staticdb import db

_GROUP_WEIGHTS = {
    key: value / 4
    for key, value in
    {
        'WHITE': 1,
        'BLUE': 1.5,
        'BLACK': 1,
        'RED': 1,
        'GREEN': 1,
        'drawgo': 3,
        'mud': 3,
        'post': 4,
        'midrange': 2,
        'mill': 4,
        'reanimate': 4,
        'burn': 4,
        'hatebear': 2,
        'removal': 1,
        'lock': 3,
        'yardvalue': 3,
        'ld': 3,
        'storm': 4,
        'tezz': 3,
        'lands': 3,
        'shatter': 3,
        'bounce': 3,
        'shadow': 4,
        'stifle': 4,
        'beat': 1,
        'cheat': 4,
        'pox': 3,
        'counter': 3,
        'discard': 2,
        'cantrip': 4,
        'balance': 3,
        'stasis': 4,
        'standstill': 3,
        'whitehate': 4,
        'bluehate': 4,
        'blackhate': 4,
        'redhate': 4,
        'greenhate': 4,
        'antiwaste': 4,
        'delirium': 3,
        'sacvalue': 2,
        'lowtoughnesshate': 4,
        'armageddon': 4,
        'stax': 3,
        'bloom': 3,
        'weldingjar': 3,
        'drawhate': 4,
        'pluscard': 3,
        'ramp': 3,
        'devoteddruid': 4,
        'fetchhate': 4,
        'dragon': 2,
        'company': 2,
        'naturalorder': 3,
        'flash': 3,
        'wincon': 3,
        'vial': 4,
        # lands
        'fixing': 3,
        'colorlessvalue': 1,
        'fetchable': 2,
        'indestructable': 4,
        'legendarymatters': 1,
        'sol': 3,
        'manland': 4,
        'storage': 3,
        'croprotate': 3,
        'dnt': 3,
        'equipment': 4,
        'livingdeath': 3,
        'eggskci': 3,
        'hightide': 3,
        'fatty': 3,
        'walker': 4,
        'blink': 2,
        'miracles': 3,
        'city': 4,
        'wrath': 2,
        'landtax': 4,
        'discardvalue': 2,
        'edict': 2,
        'phoenix': 4,
        'enchantress': 2,
        'dork': 2,
        'tinker': 3,
        'highpowerhate': 2,
        'affinity': 3,
        'academy': 4,
        'stompy': 2,
        'shardless': 3,
        'lanterns': 3,
        'depths': 3,
        'survival': 2,
        'landstill': 2,
        'moat': 4,
        'combo': 3,
        'kite': 3,
        'haste': 3,
        'fog': 3,
        'threat': 4,
    }.items()
}


class QueueConsumer(threading.Thread):

    def __init__(
        self,
        q: queue.Queue,
        callback: t.Callable[[t.Dict[str, t.Any]], None],
        **kwargs,
    ) -> None:
        super().__init__()
        self._q = q
        self._callback = callback
        self._terminating = threading.Event()

    def stop(self) -> None:
        self._terminating.set()

    def run(self) -> None:
        while not self._terminating.is_set():
            try:
                self._callback(
                    self._q.get(timeout = 5)
                )
            except queue.Empty:
                pass


class DistributorConsumer(JsonWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._distribution_task: t.Optional[DistributionTask] = None
        self._consumer: t.Optional[QueueConsumer] = None

        self._patch: t.Optional[models.CubePatch] = None
        self._patch_pk: t.Optional[int] = None
        self._subscription_channel_name: t.Optional[str] = None

    def _send_message(self, message_type: str, content: t.Any) -> None:
        self.send_json(
            {
                'type': message_type,
                'content': content,
            }
        )

    def _generate_new_distribution(self):

        versioned_cube = self._patch.versioned_cube
        latest_release = versioned_cube.latest_release

        # # TODO handle no nodes
        nodes = latest_release.constrained_nodes

        strategy = JsonId(db)

        cube_patch = strategy.deserialize(
            CubePatch,
            self._patch.content,
        )

        cube = strategy.deserialize(
            Cube,
            latest_release.cube_content,
        )

        constrained_nodes = strategy.deserialize(
            NodeCollection,
            nodes.constrained_nodes_content,
        )

        for node in constrained_nodes.nodes.distinct_elements():
            node._value /= 5

        distribution_nodes = list(map(algorithm.DistributionNode, constrained_nodes))

        updater = CubeUpdater(
            cube = cube,
            node_collection = constrained_nodes,
            patch = cube_patch,
        )

        trap_amount = updater.new_garbage_trap_amount

        constraint_set = model.ConstraintSet(
            (
                (
                    algorithm.SizeHomogeneityConstraint(
                        distribution_nodes,
                        trap_amount,
                    ),
                    1,
                ),
                (
                    algorithm.ValueDistributionHomogeneityConstraint(
                        distribution_nodes,
                        trap_amount,
                    ),
                    2,
                ),
                (
                    algorithm.GroupExclusivityConstraint(
                        distribution_nodes,
                        trap_amount,
                        _GROUP_WEIGHTS,
                    ),
                    2,
                ),
            )
        )

        distributor = Distributor(
            nodes = constrained_nodes,
            trap_amount = trap_amount,
            initial_population_size = 300,
            group_weights = _GROUP_WEIGHTS,
            constraints = constraint_set,
        )

    def connect(self):
        self._patch_pk = int(self.scope["url_route"]["kwargs"]["pk"])
        try:
            self._patch = models.CubePatch.objects.get(pk=self._patch_pk)
        except models.CubePatch.DoesNotExist:
            return

        self.accept()

        self._subscription_channel_name = f'{self._patch_pk}_{id(self)}'

        distributor_task = DISTRIBUTOR_SERVICE.connect(self._patch_pk)
        if distributor_task is not None:
            self._distribution_task = distributor_task
            self._consumer = QueueConsumer(
                distributor_task.subscribe(str(id(self))),
                self.send_json,
            )
            self._consumer.start()

    def disconnect(self, close_code):
        self._distribution_task.unsubscribe('hihi')
        self._consumer.stop()

    def receive_json(self, content, **kwargs):
        print('received', content)
