import traceback
import typing as t

from collections import OrderedDict
from distutils.util import strtobool

from asgiref.sync import async_to_sync

from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError

from evolution import model
from evolution import logging
from evolution.environment import Environment

from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.serilization.strategies.raw import RawStrategy

from magiccube.collections.laps import TrapCollection
from magiccube.laps.traps.distribute.delta import DeltaDistributor
from magiccube.laps.traps.distribute import algorithm
from magiccube.laps.traps.distribute.algorithm import Distributor, TrapDistribution, TrapCollectionIndividual
from magiccube.update import cubeupdate
from magiccube.update.cubeupdate import CubePatch, CubeUpdater, CUBE_CHANGE_MAP
from magiccube.update.report import UpdateReport

from api import models
from api.serialization import orpserialize, serializers
from api import tasks
from api.services import DISTRIBUTOR_SERVICE, DistributionTask
from resources.staticdb import db
from utils.consumers import QueueConsumer, AuthenticatedConsumer


class DistributorConsumer(AuthenticatedConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._patch_pk: t.Optional[int] = None
        self._group_name: t.Optional[str] = None

        self._distribution_task: t.Optional[DistributionTask] = None
        self._consumer: t.Optional[QueueConsumer] = None

        self._patch: t.Optional[models.CubePatch] = None
        self._versioned_cube: t.Optional[models.VersionedCube] = None
        self._updater: t.Optional[CubeUpdater] = None
        self._value_value_map = {
            0: 0,
            1: 1,
            2: 5,
            3: 15,
            4: 25,
            5: 50,
        }

        self._logging_scheme = OrderedDict(
            (
                (
                    'Max',
                    logging.LogMax(),
                ),
                (
                    'Mean',
                    logging.LogAverage(),
                ),
                (
                    'Size Homogeneity',
                    logging.LogAverageConstraint(1),
                ),
                (
                    'Value Homogeneity',
                    logging.LogAverageConstraint(2),
                ),
                (
                    'Group Collisions',
                    logging.LogAverageConstraint(3),
                ),
            )
        )

    def connect(self):
        self._patch_pk = int(self.scope['url_route']['kwargs']['pk'])
        self._group_name = f'distributor_{self._patch_pk}'
        self.accept()

    def disconnect(self, code):
        if self._distribution_task is not None:
            self._distribution_task.unsubscribe(
                str(
                    id(
                        self
                    )
                )
            )
            self._consumer.stop()
        if self._group_name is not None:
            async_to_sync(self.channel_layer.group_discard)(
                self._group_name,
                self.channel_name,
            )

    def _get_distributor(self, delta: bool, **kwargs) -> Environment[TrapCollectionIndividual]:
        constrained_nodes = self._updater.new_nodes
        distribution_nodes = list(map(algorithm.DistributionNode, constrained_nodes))

        for node in distribution_nodes:
            node.value = self._value_value_map.get(node.value, node.value)

        max_node_weight = max(node.value for node in distribution_nodes)

        for node in distribution_nodes:
            node.value /= max_node_weight

        group_map = self._updater.new_groups.normalized()

        trap_amount = self._updater.new_garbage_trap_amount

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
                        group_map.groups,
                    ),
                    2,
                ),
            )
        )

        if delta:
            return DeltaDistributor(
                distribution_nodes = distribution_nodes,
                trap_amount = trap_amount,
                constraints = constraint_set,
                original_collection = TrapCollection(self._versioned_cube.latest_release.cube.garbage_traps),
                max_trap_delta = kwargs.get('max_trap_delta', 1),
                save_generations = False,
                logger = logging.Logger(self._logging_scheme),
            )
        else:
            return Distributor(
                distribution_nodes = distribution_nodes,
                trap_amount = trap_amount,
                constraints = constraint_set,
                save_generations = False,
                logger = logging.Logger(self._logging_scheme),
            )

    def _connect_distributor(self) -> None:
        self._distribution_task = DISTRIBUTOR_SERVICE.connect(self._patch_pk)

        self._consumer = QueueConsumer(
            self._distribution_task.subscribe(
                str(
                    id(
                        self
                    )
                )
            ),
            self.send_json,
            daemon = True,
        )
        self._consumer.start()

    def _on_user_authenticated(self, auth_token: t.AnyStr, user: get_user_model()) -> None:
        async_to_sync(self.channel_layer.group_add)(
            self._group_name,
            self.channel_name,
        )

        try:
            self._patch = models.CubePatch.objects.get(pk = self._patch_pk)
        except models.CubePatch.DoesNotExist:
            self._send_error(f'no patch with id {self._patch_pk}')
            self.close()
            return

        self._versioned_cube = self._patch.versioned_cube
        latest_release = self._versioned_cube.latest_release

        cube_patch = self._patch.patch

        meta_cube = latest_release.as_meta_cube()

        self._updater = CubeUpdater(
            meta_cube = meta_cube,
            patch = cube_patch,
        )

        self.send_json(
            {
                'type': 'items',
                'series_labels': list(self._logging_scheme.keys()),
                'patch': serializers.CubePatchSerializer(self._patch).data,
                'verbose_patch': orpserialize.VerbosePatchSerializer.serialize(
                    cube_patch.as_verbose(
                        meta_cube
                    )
                ),
                'preview': orpserialize.MetaCubeSerializer.serialize(meta_cube + cube_patch),
                'distributions': [
                    serializers.DistributionPossibilitySerializer(distribution).data
                    for distribution in
                    models.DistributionPossibility.objects.filter(
                        patch = self._patch,
                        patch_checksum = cube_patch.persistent_hash(),
                        release = self._versioned_cube.latest_release,
                    ).order_by('-created_at')
                ],
                'report': orpserialize.UpdateReportSerializer.serialize(
                    UpdateReport(
                        CubeUpdater(meta_cube, cube_patch)
                    )
                ),
            }
        )

        self._connect_distributor()

    def _receive_message(self, message_type: str, content: t.Any) -> None:
        if message_type == 'start':
            try:
                delta = bool(content['delta'])
                if delta:
                    max_trap_delta = int(content['max_trap_delta'])
                else:
                    max_trap_delta = 1
            except (ValueError, KeyError):
                self._send_error('Invalid arguments')
                return

            if not self._distribution_task.is_working:
                self._distribution_task.submit(
                    self._get_distributor(delta, max_trap_delta = max_trap_delta)
                )
            else:
                self._send_error('Distributor is busy, stop it before restarting')

        elif message_type == 'pause':
            if not (self._distribution_task and self._distribution_task.is_alive()):
                self._send_message('status', status = 'stopped')
                return
            self._distribution_task.pause()

        elif message_type == 'resume':
            if not (self._distribution_task and self._distribution_task.is_alive()):
                self._send_message('status', status = 'stopped')
                return
            self._distribution_task.resume()

        elif message_type == 'stop':
            if not (self._distribution_task and self._distribution_task.is_alive()):
                self._send_message('status', status = 'stopped')
                return
            self._distribution_task.cancel()

        elif message_type == 'capture':
            if not self._distribution_task.status == 'paused':
                self._send_error('Distributor must be paused to generate trap images')
                return

            try:
                trap_collection = self._distribution_task.get_latest_fittest().as_trap_collection()
            except TrapDistribution.InvalidDistribution:
                self._send_error('Distribution is invalid')
                return

            try:
                possibility = models.DistributionPossibility.objects.create(
                    patch_id = self._patch_pk,
                    release = self._versioned_cube.latest_release,
                    trap_collection = trap_collection,
                    patch_checksum = self._updater.patch.persistent_hash(),
                    distribution_checksum = trap_collection.persistent_hash(),
                    fitness = self._distribution_task.get_latest_fittest().fitness[0],
                )
            except IntegrityError:
                self._send_error('Distribution already captured')
                return

            async_to_sync(self.channel_layer.group_send)(
                self._group_name,
                {
                    'type': 'distribution_possibility',
                    'content': serializers.DistributionPossibilitySerializer(possibility).data,
                },
            )

            tasks.generate_distribution_pdf.delay(
                self._patch_pk,
                possibility.id,
                include_changes_pdf = True,
            )

        elif message_type == 'apply':
            possibility_id = content.get('possibility_id')

            fork = content.get('fork', False)

            with transaction.atomic():
                if possibility_id is not None:
                    try:
                        possibility = models.DistributionPossibility.objects.filter(
                            pk = possibility_id,
                            patch_id = self._patch_pk,
                        ).select_for_update().get().trap_collection
                    except models.DistributionPossibility.DoesNotExist:
                        self._send_error('Invalid possibility id')
                        return
                else:
                    possibility = None

                finale_cube = self._updater.get_finale_cube(possibility)

                if fork:
                    try:
                        versioned_cube_name = content['name']
                    except KeyError:
                        self._send_error('invalid name')
                        return

                    versioned_cube_description = content.get('description', 'Forked from {}'.format(self._versioned_cube.name))

                    versioned_cube = models.VersionedCube.objects.create(
                        name = versioned_cube_name,
                        description = versioned_cube_description,
                        author = self.scope['user'],
                        forked_from = self._versioned_cube
                    )
                else:
                    versioned_cube = self._versioned_cube

                new_release = models.CubeRelease.create(
                    cube = finale_cube,
                    versioned_cube = versioned_cube,
                    infinites = self._updater.new_infinites,
                )

                models.ConstrainedNodes.objects.create(
                    constrained_nodes = self._updater.new_nodes,
                    group_map = self._updater.new_groups,
                    release = new_release,
                )

                self._patch.delete()

                async_to_sync(self.channel_layer.group_send)(
                    self._group_name,
                    {
                        'type': 'update_success',
                        'new_release': new_release.id,
                    },
                )

                tasks.generate_release_images.delay(
                    new_release.id,
                )

        else:
            self._send_error(f'Unknown message type "{message_type}"')

    def distribution_pdf_update(self, event):
        self.send_json(
            {
                'type': 'distribution_pdf',
                'url': event['pdf_url'],
                'added_url': event.get('added_pdf_url'),
                'removed_url': event.get('removed_pdf_url'),
                'possibility_id': event['possibility_id'],
            }
        )

    def distribution_possibility(self, event) -> None:
        self.send_json(
            {
                'type': 'distribution_possibility',
                'content': event['content']
            }
        )

    def update_success(self, event) -> None:
        self.send_json(
            {
                'type': 'update_success',
                'new_release': event['new_release'],
            }
        )


class PatchEditConsumer(AuthenticatedConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._patch_pk: t.Optional[int] = None
        self._group_name: t.Optional[str] = None

    def _set_locked(self, locked: bool) -> None:
        self._send_message('status', status = 'locked' if locked else 'unlocked')

    def connect(self) -> None:
        self._patch_pk = int(self.scope['url_route']['kwargs']['pk'])
        self._group_name = f'patch_edit_{self._patch_pk}'

        self.accept()

    def _on_user_authenticated(self, auth_token: t.AnyStr, user: get_user_model()) -> None:
        if DISTRIBUTOR_SERVICE.is_patch_locked(self._patch_pk):
            self._set_locked(True)
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

    def _receive_message(self, message_type: str, content: t.Any) -> None:
        if not message_type == 'update':
            return

        if DISTRIBUTOR_SERVICE.is_patch_locked(self._patch_pk):
            self._send_message('status', status = 'locked')
            return

        with transaction.atomic():
            try:
                patch = (
                    models.CubePatch.objects
                        .select_for_update()
                        .get(pk = self._patch_pk)
                )
            except models.CubePatch.DoesNotExist:
                self._send_error(f'no patch with id {self._patch_pk}')
                self.close()
                return

            update = content.get('update')
            change_undoes = content.get('change_undoes')

            if not update and not change_undoes:
                self._send_error('update must have at least one of "updates" or "change_undoes" fields')
                return

            patch_update = CubePatch()

            if update:
                try:
                    update = RawStrategy(db).deserialize(
                        CubePatch,
                        update,
                    )
                except (KeyError, AttributeError):
                    self._send_error('bad request')
                    return

                patch_update += update

            if change_undoes:

                undoes: t.List[t.Tuple[cubeupdate.CubeChange, int]] = []
                try:
                    for undo, multiplicity in change_undoes:
                        undoes.append(
                            (
                                JsonId(db).deserialize(
                                    CUBE_CHANGE_MAP[undo['type']],
                                    undo['content'],
                                ),
                                multiplicity,
                            )
                        )
                except (KeyError, TypeError, ValueError):
                    traceback.print_exc()
                    self._send_error('bad request')
                    return

                for undo, multiplicity in undoes:
                    patch_update -= (undo.as_patch() * multiplicity)

            patch.patch += patch_update
            patch.save()

            meta_cube = patch.versioned_cube.latest_release.as_meta_cube()

            msg = {
                'type': 'cube_update',
                'update': {
                    'patch': orpserialize.CubePatchOrpSerializer.serialize(
                        patch.patch
                    ),
                    'verbose_patch': orpserialize.VerbosePatchSerializer.serialize(
                        patch.patch.as_verbose(
                            meta_cube
                        )
                    ),
                    'preview': orpserialize.MetaCubeSerializer.serialize(
                        meta_cube + patch.patch
                    ),
                    'updater': serializers.UserSerializer(self.scope['user']).data,
                    'update': orpserialize.VerbosePatchSerializer.serialize(
                        patch_update.as_verbose(
                            meta_cube
                        )
                    )
                },
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

    def patch_lock(self, event):
        self._set_locked(event['action'] == 'acquirer')

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


class DeltaPdfConsumer(AuthenticatedConsumer):
    _working: t.Set[t.Tuple[int, int]] = set()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._id_from: t.Optional[int] = None
        self._id_to: t.Optional[int] = None
        self._group_name: t.Optional[str] = None

    def connect(self):
        self._id_from = int(self.scope['url_route']['kwargs']['id_from'])
        self._id_to = int(self.scope['url_route']['kwargs']['id_to'])
        self._group_name = f'pdf_delta_generate_{self._id_from}_{self._id_to}'
        async_to_sync(self.channel_layer.group_add)(
            self._group_name,
            self.channel_name,
        )

        self.accept()

        if (self._id_from, self._id_to) in self._working:
            self._send_message('status', status = 'generating')

    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self._group_name,
            self.channel_name,
        )

    def _receive_message(self, message_type: str, content: t.Any) -> None:
        if message_type == 'generate':
            if (self._id_from, self._id_to) in self._working:
                self._send_error('Already generating')
            elif models.LapChangePdf.objects.filter(
                original_release_id = self._id_from,
                resulting_release_id = self._id_to,
            ):
                self._send_error('Already generated')
            else:
                self._working.add((self._id_from, self._id_to))
                tasks.generate_release_lap_delta_pdf.delay(
                    self._id_from,
                    self._id_to,
                )
                self._send_message('status', status = 'generating')

    def delta_pdf_update(self, event: t.Mapping[str, t.Any]):
        try:
            self._working.remove((self._id_from, self._id_to))
        except KeyError:
            pass

        self.send_json(
            {
                'type': 'delta_pdf_update',
                'pdf_url': event['pdf_url'],
            }
        )
