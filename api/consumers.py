import typing as t

import json
import threading
import time
import random
import queue

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer, JsonWebsocketConsumer
from channels.layers import get_channel_layer
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from knox.auth import TokenAuthentication

from api import models
from api.serialization import orpserialize, serializers
from evolution import model
from evolution.logging import LogFrame

from api.services import DISTRIBUTOR_SERVICE
from magiccube.collections.cube import Cube
from magiccube.collections.nodecollection import NodeCollection
from magiccube.laps.traps.distribute import algorithm
from magiccube.laps.traps.distribute.algorithm import Distributor
from magiccube.laps.traps.distribute.distribute import DistributionTask
from magiccube.update import cubeupdate
from magiccube.update.cubeupdate import CubePatch, CubeUpdater
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.serilization.strategies.raw import RawStrategy
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
            self._patch = models.CubePatch.objects.get(pk = self._patch_pk)
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


class PatchEditConsumer(JsonWebsocketConsumer):
    _undo_map: t.Dict[str, t.Type[cubeupdate.CubeChange]] = {
        klass.__name__: klass
        for klass in
        (
            cubeupdate.NewCubeable,
            cubeupdate.RemovedCubeable,
            cubeupdate.NewNode,
            cubeupdate.RemovedNode,
            cubeupdate.PrintingsToNode,
            cubeupdate.NodeToPrintings,
            cubeupdate.TrapToNode,
            cubeupdate.NodeToTrap,
            cubeupdate.AlteredNode,
        )
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._patch_pk: t.Optional[int] = None
        self._group_name: t.Optional[str] = None
        self._token: t.Optional[t.ByteString] = None

    def connect(self):
        self._patch_pk = int(self.scope['url_route']['kwargs']['pk'])
        self._group_name = f'patch_edit_{self._patch_pk}'

        self.accept()

    def _send_message(self, message_type: str, **kwargs):
        d = {'type': message_type}
        d.update(kwargs)
        self.send_json(d)

    def _send_error(self, message: t.Any):
        self.send_json(
            {
                'type': 'error',
                'message': message,
            }
        )

    def receive_json(self, content, **kwargs):
        print(content)

        message_type = content.get('type')

        if message_type is None:
            self._send_error('No Message type')
            return

        if message_type == 'authentication':
            knox_auth = TokenAuthentication()
            if not isinstance(content['token'], str):
                self._send_message('authentication', state = 'failure', reason = 'invalid token field')
            else:
                user, auth_token = knox_auth.authenticate_credentials(content['token'].encode('UTF-8'))
                if user is not None:
                    self._token = auth_token
                    self.scope['user'] = user
                    self._send_message('authentication', state = 'success')
                    async_to_sync(self.channel_layer.group_add)(
                        self._group_name,
                        self.channel_name,
                    )
                    async_to_sync(self.channel_layer.group_send)(
                        self._group_name,
                        {
                            'type': 'user_update',
                            'action': 'enter',
                            'user': self.scope['user'].username,
                        },
                    )
                else:
                    self._send_message('authentication', state = 'failure', reason = 'invalid token')
            return

        if self._token is None:
            self._send_error('not logged in')
            return

        if message_type == 'update':
            with transaction.atomic():
                try:
                    patch = (
                        models.CubePatch.objects
                            .select_for_update()
                            .get(pk = self._patch_pk)
                    )
                except models.CubePatch.DoesNotExist:
                    self._send_error(f'no patch with id {self._patch_pk}')
                    return

                update = content.get('update')
                change_undoes = content.get('change_undoes')

                if not update and not change_undoes:
                    self._send_error('update must have at least one of "updates" or "change_undoes" fields')
                    return

                current_patch = JsonId(db).deserialize(
                    CubePatch,
                    patch.content,
                )

                if update:
                    try:
                        update = RawStrategy(db).deserialize(
                            CubePatch,
                            update,
                        )
                    except (KeyError, AttributeError):
                        self._send_error('bad request')
                        return

                    current_patch += update

                if change_undoes:

                    undoes: t.List[t.Tuple[cubeupdate.CubeChange, int]] = []
                    try:
                        for undo, multiplicity in change_undoes:
                            undoes.append(
                                (
                                    RawStrategy(db).deserialize(
                                        self._undo_map[undo['type']],
                                        undo['content'],
                                    ),
                                    multiplicity,
                                )
                            )
                    except (KeyError, TypeError, ValueError):
                        self._send_error('bad request')
                        return

                    for undo, multiplicity in undoes:
                        current_patch -= (undo.as_patch() * multiplicity)

                patch.content = JsonId.serialize(
                    current_patch,
                )

                patch.save()

                latest_release = patch.versioned_cube.latest_release

                current_cube = JsonId(db).deserialize(
                    Cube,
                    latest_release.cube_content,
                )

                msg = {
                    'type': 'cube_update',
                    'update': {
                        'patch': serializers.CubePatchSerializer(patch).data,
                        'verbose_patch': orpserialize.VerbosePatchSerializer.serialize(
                            current_patch.as_verbose
                        ),
                        'preview': {
                            'cube': orpserialize.CubeSerializer.serialize(
                                current_cube + current_patch.cube_delta_operation,
                            ),
                            'nodes': {
                                'constrained_nodes_content': orpserialize.ConstrainedNodesOrpSerializer.serialize(
                                    (
                                        JsonId(db).deserialize(
                                            NodeCollection,
                                            latest_release.constrained_nodes.constrained_nodes_content,
                                        ) + current_patch.node_delta_operation
                                        if hasattr(latest_release, 'constrained_nodes') else
                                        NodeCollection(())
                                    )
                                )
                            },
                        },
                    }
                }

                async_to_sync(self.channel_layer.group_send)(
                    self._group_name,
                    msg,
                )

    def cube_update(self, event):
        self.send_json(
            {
                'type': 'update',
                'content': event['update']
            }
        )

    def user_update(self, event):
        action = event['action']
        user = event['user']
        if action == 'enter' and user != self.scope['user'].username:
            async_to_sync(self.channel_layer.group_send)(
                self._group_name,
                {
                    'type': 'user_update',
                    'action': 'here',
                    'user': self.scope['user'].username,
                },
            )

        self.send_json(
            {
                'type': 'user_update',
                'user': event['user'],
                'action': event['action'],
            }
        )

    def disconnect(self, code):
        if self._token is not None:
            async_to_sync(self.channel_layer.group_send)(
                self._group_name,
                {
                    'type': 'user_update',
                    'action': 'leave',
                    'user': self.scope['user'].username,
                },
            )
        async_to_sync(self.channel_layer.group_discard)(
            self._group_name,
            self.channel_name,
        )
