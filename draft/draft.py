from __future__ import annotations

import datetime
import random
import time
import typing as t
import threading

from abc import ABC, abstractmethod
from queue import Empty

from django.contrib.auth.models import AbstractUser
from channels.generic.websocket import WebsocketConsumer

from ring import Ring

from mtgorp.models.serilization.serializeable import SerializationException
from mtgorp.models.limited.boostergen import GenerateBoosterException
from mtgorp.models.serilization.strategies.raw import RawStrategy

from magiccube.collections.cube import Cube
from magiccube.collections.cubeable import Cubeable
from magiccube.collections.infinites import Infinites

from mtgdraft.models import DraftBooster, Pick, SinglePickPick, BurnPick

from api.serialization.serializers import UserSerializer
from draft.models import DraftSession, DraftSeat, DraftPick
from draft.tasks import create_draft_session_related_printings
from limited.models import PoolSpecification
from limited.serializers import PoolSpecificationSerializer
from lobbies.exceptions import StartGameException
from resources.staticdb import db
from utils.queue import Queue


class Drafter(object):

    def __init__(self, user: AbstractUser, key: str):
        self._user = user
        self._key = key

    @property
    def user(self) -> AbstractUser:
        return self._user

    @property
    def key(self) -> str:
        return self._key

    def __eq__(self, other) -> bool:
        return (
            isinstance(other, self.__class__)
            and self._key == other._key
        )

    def __hash__(self) -> int:
        return hash(self._key)

    def __repr__(self) -> str:
        return '{}({}, {})'.format(
            self.__class__.__name__,
            self._user.username,
            self._key,
        )


class DraftInterface(ABC):
    pick_type: t.Type[Pick]
    passing_to: DraftInterface

    class ConnectionException(Exception):
        pass

    def __init__(self, drafter: Drafter, draft: Draft, draft_seat: DraftSeat):
        super().__init__()
        self._drafter = drafter
        self._draft = draft
        self._draft_seat = draft_seat

        self._pool = Cube()

        self._messages: t.List[t.Mapping[str, t.Any]] = []
        self._pick_counter = 0

        self._booster_queue = Queue()
        self._pick_queue = Queue()
        self._out_queue = Queue()

        self._current_booster_lock = threading.Lock()
        self._current_booster: t.Optional[DraftBooster] = None

        self._terminating = threading.Event()

        self._booster_pusher = threading.Thread(target = self._draft_loop)

        self._connect_lock = threading.Lock()
        self._consumer: t.Optional[WebsocketConsumer] = None

    @property
    def messages(self) -> t.List[t.Mapping[str, t.Any]]:
        return self._messages

    @property
    def pool(self) -> Cube:
        return self._pool

    def connect(self, consumer: WebsocketConsumer) -> None:
        with self._connect_lock:
            if self._consumer is not None:
                raise self.ConnectionException('already connected')
            self._consumer = consumer

    def disconnect(self) -> None:
        with self._connect_lock:
            if self._consumer is None:
                raise self.ConnectionException('no consumer connected')
            self._consumer = None

    def send_message(self, message_type: str, **kwargs) -> None:
        self.out_queue.put(
            {
                'type': message_type,
                **kwargs,
            }
        )

    def send_error(self, error_type: str, **kwargs):
        self.send_message('error', error_type = error_type, **kwargs)

    @property
    def booster_queue(self) -> Queue[DraftBooster]:
        return self._booster_queue

    @property
    def booster_amount(self) -> int:
        return self._booster_queue.qsize() + (1 if self._current_booster else 0)

    def give_booster(self, booster: DraftBooster) -> None:
        self._booster_queue.put(booster)
        self._draft.broadcast_message(
            'booster_amount_update',
            drafter = self._drafter.user.pk,
            queue_size = self.booster_amount,
        )

    @property
    def pick_queue(self) -> Queue[Cubeable]:
        return self._pick_queue

    @property
    def out_queue(self):
        return self._out_queue

    def receive_message(self, message: t.Any) -> None:
        message_type = message.get('type')

        if message_type == 'pick':
            pick = message.get('pick')
            if pick is None:
                self.send_error('empty_pick')
                return

            try:
                pick = RawStrategy(db).deserialize(self.pick_type, pick)
            except SerializationException:
                self.send_error('misconstrued_pick')
                return

            self._pick_queue.put(pick)

        else:
            self.send_error('unknown_message_type', message_type = message_type)

    def start(self) -> None:
        self.send_message(
            'started',
            **self._draft.serialize(),
        )
        self._booster_pusher.start()

    def stop(self) -> None:
        self._terminating.set()

    @abstractmethod
    def perform_pick(self, pick: Pick) -> bool:
        pass

    @abstractmethod
    def get_random_pick(self) -> Pick:
        pass

    def _get_timeout_handler(self, booster: DraftBooster, pick_number: int) -> t.Callable[[], None]:
        def _handle_timeout() -> None:
            with self._current_booster_lock:
                if booster == self._current_booster and booster.pick_number == pick_number:
                    self._pick_queue.put(self.get_random_pick())

        return _handle_timeout

    def _get_current_time_control(self) -> t.Optional[float]:
        if self._draft.time_control is None:
            return self._draft.time_control
        if self._pick_counter == 0:
            return self._draft.time_control + 10
        return self._draft.time_control

    def _draft_loop(self) -> None:
        while not self._terminating.is_set():
            try:
                booster = self._booster_queue.get(timeout = 2)
            except Empty:
                continue

            with self._current_booster_lock:
                self._current_booster = booster

            time_control = self._get_current_time_control()
            self.send_message(
                'booster',
                booster = RawStrategy.serialize(self._current_booster),
                timeout = time_control,
                began_at = time.time(),
            )
            if time_control:
                threading.Timer(time_control, self._get_timeout_handler(booster, self._current_booster.pick_number)).start()

            while not self._terminating.is_set():
                try:
                    pick = self._pick_queue.get(timeout = 2)
                except Empty:
                    continue

                if not self.perform_pick(pick):
                    self.send_error(
                        'invalid_pick',
                        pick = pick.serialize(),
                    )
                    continue

                self._pick_counter += 1

                self.send_message(
                    'pick',
                    pick = pick.serialize(),
                    booster = RawStrategy.serialize(self._current_booster),
                    pick_number = self._pick_counter,
                )

                DraftPick.objects.create(
                    seat = self._draft_seat,
                    pack_number = self._draft.pack_counter,
                    pick_number = self._current_booster.pick_number,
                    global_pick_number = self._pick_counter - 1,
                    pack = self._current_booster,
                    pick = pick,
                    booster_id = self._current_booster.booster_id,
                )

                self._current_booster.pick_number += 1

                if self._current_booster.cubeables:
                    self.passing_to.give_booster(self._current_booster)
                else:
                    self._draft.booster_empty(self._current_booster)
                self._current_booster = None
                self._draft.broadcast_message(
                    'booster_amount_update',
                    drafter = self._drafter.user.pk,
                    queue_size = self.booster_amount,
                )
                break


class SinglePickInterface(DraftInterface):
    pick_type = SinglePickPick

    def get_random_pick(self) -> SinglePickPick:
        return SinglePickPick(random.choice(list(self._current_booster.cubeables)))

    def perform_pick(self, pick: SinglePickPick) -> bool:
        if pick.cubeable not in self._current_booster.cubeables:
            return False

        _pick = Cube((pick.cubeable,))
        self._current_booster.cubeables -= _pick
        self._pool += _pick

        return True


class BurnInterface(DraftInterface):
    pick_type = BurnPick

    def get_random_pick(self) -> BurnPick:
        cubeables = list(self._current_booster.cubeables)
        if len(cubeables) == 1:
            return BurnPick(cubeables[0], None)
        return BurnPick(*random.sample(cubeables, 2))

    def perform_pick(self, pick: BurnPick) -> bool:
        if len(self._current_booster.cubeables) > 1 and pick.burn is None:
            return False

        pick_remove = Cube((pick.pick, pick.burn)) if pick.burn is not None else Cube((pick.pick,))

        if not pick_remove.cubeables <= self._current_booster.cubeables.cubeables:
            return False

        self._current_booster.cubeables -= pick_remove
        self._pool += Cube((pick.pick,))

        return True


class Draft(object):

    def __init__(
        self,
        key: str,
        drafters: Ring[Drafter],
        pool_specification: PoolSpecification,
        infinites: Infinites,
        draft_format: str,
        reverse: bool,
        time_control: t.Optional[None],
        finished_callback: t.Callable[[Draft], None],
    ):
        self._key = key

        self._drafters = drafters
        self._pool_specification = pool_specification
        self._infinites = infinites
        self._draft_format = draft_format
        self._reverse = reverse
        self._time_control = time_control

        self._finished_callback = finished_callback

        self._active_boosters: t.MutableMapping[DraftBooster, bool] = {}
        self._active_boosters_lock = threading.Lock()

        self._clockwise = True
        self._pack_counter = 0

        self._pack_amount = sum(
            booster_specification.amount
            for booster_specification in
            self._pool_specification.specifications.all()
        )

        try:
            self._boosters = [
                [
                    DraftBooster(booster)
                    for booster in
                    player_boosters
                ]
                for player_boosters in
                self._pool_specification.get_boosters(len(self._drafters))
            ]
        except GenerateBoosterException:
            raise StartGameException('Cannot generate required boosters')

        self._drafter_interfaces: t.MutableMapping[Drafter, DraftInterface] = {}
        self._draft_session: t.Optional[DraftSession] = None

    @property
    def time_control(self) -> t.Optional[float]:
        return self._time_control

    @property
    def drafters(self) -> t.Iterable[Drafter]:
        return self._drafters.all

    @property
    def key(self) -> str:
        return self._key

    @property
    def interfaces(self) -> t.Mapping[Drafter, DraftInterface]:
        return self._drafter_interfaces

    @property
    def draft_session(self) -> DraftSession:
        return self._draft_session

    @property
    def pack_counter(self) -> int:
        return self._pack_counter

    def serialize(self) -> t.Mapping[str, t.Any]:
        return {
            'drafters': [
                UserSerializer(drafter.user).data
                for drafter in
                self._drafters.all
            ],
            'pack_amount': self._pack_amount,
            'draft_format': self._draft_format,
            'pool_specification': PoolSpecificationSerializer(self._pool_specification).data,
            'infinites': RawStrategy.serialize(self._infinites),
            'reverse': self._reverse,
        }

    def broadcast_message(self, message_type: str, **kwargs) -> None:
        for interface in self._drafter_interfaces.values():
            interface.send_message(message_type, **kwargs)

    def booster_empty(self, booster: DraftBooster) -> None:
        with self._active_boosters_lock:
            self._active_boosters[booster] = True
            if all(self._active_boosters.values()):
                self._administer_boosters()

    def get_draft_interface(self, drafter: Drafter) -> DraftInterface:
        return self._drafter_interfaces[drafter]

    def _chain_booster_queues(self) -> None:
        for drafter, interface in self._drafter_interfaces.items():
            interface.passing_to = self._drafter_interfaces[
                self._drafters.before(drafter)
                if self._clockwise else
                self._drafters.after(drafter)
            ]

        self._clockwise = not self._clockwise

    def _administer_boosters(self) -> None:
        if any(not boosters for boosters in self._boosters):
            self.completed()
            return

        self._chain_booster_queues()

        self._active_boosters.clear()

        self._pack_counter += 1

        for interface, player_boosters in zip(self._drafter_interfaces.values(), self._boosters):
            interface.send_message(
                'round',
                round = {
                    'pack': self._pack_counter,
                    'clockwise': self._clockwise,
                },
            )
            booster = player_boosters.pop(0)
            self._active_boosters[booster] = False
            interface.give_booster(booster)

    def completed(self) -> None:
        self._draft_session.state = DraftSession.DraftState.COMPLETED
        self._draft_session.ended_at = datetime.datetime.now()
        self._draft_session.save(update_fields = ('state', 'ended_at'))
        create_draft_session_related_printings.delay(self._draft_session.id)
        self._finished_callback(self)
        for interface in self._drafter_interfaces.values():
            interface.send_message('completed')

    _draft_format_map = {
        'single_pick': SinglePickInterface,
        'burn': BurnInterface,
    }

    def start(self) -> None:
        interface_type = self._draft_format_map[self._draft_format]

        self._draft_session = DraftSession.objects.create(
            key = self._key,
            draft_format = self._draft_format,
            pool_specification = self._pool_specification,
            infinites = self._infinites,
            reverse = self._reverse,
            time_control = self._time_control,
        )

        self._drafter_interfaces = {
            drafter: interface_type(
                drafter = drafter,
                draft = self,
                draft_seat = DraftSeat.objects.create(
                    user = drafter.user,
                    session = self._draft_session,
                    sequence_number = idx,
                ),
            )
            for idx, drafter in
            enumerate(self._drafters.all)
        }
        for interface in self._drafter_interfaces.values():
            interface.start()

        self._administer_boosters()
