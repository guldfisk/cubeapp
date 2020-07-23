from __future__ import annotations

import datetime
import typing as t
import threading
from abc import ABC, abstractmethod
from queue import Queue, Empty

from django.contrib.auth.models import AbstractUser
from channels.generic.websocket import WebsocketConsumer

from draft.models import DraftSession, DraftSeat, DraftPick
from magiccube.collections.infinites import Infinites
from ring import Ring

from mtgorp.models.serilization.serializeable import SerializationException
from mtgorp.models.limited.boostergen import GenerateBoosterException
from mtgorp.models.serilization.strategies.raw import RawStrategy

from magiccube.collections.cube import Cube
from magiccube.collections.cubeable import Cubeable

from mtgdraft.models import Booster, Pick, SinglePickPick, BurnPick

from api.serialization.serializers import UserSerializer
from lobbies.exceptions import StartGameException
from limited.models import PoolSpecification
from limited.serializers import PoolSpecificationSerializer
from resources.staticdb import db


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
    boost_out_queue: Queue
    pick_type: t.Type[Pick]

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

        self._current_booster: t.Optional[Booster] = None

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

    def send_message(self, message_type: str, **kwargs):
        self.out_queue.put(
            {
                'type': message_type,
                **kwargs,
            }
        )

    def send_error(self, error_type: str, **kwargs):
        self.send_message('error', error_type = error_type, **kwargs)

    @property
    def booster_queue(self) -> Queue[Booster]:
        return self._booster_queue

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

    def _draft_loop(self) -> None:
        while not self._terminating.is_set():
            try:
                booster = self._booster_queue.get(timeout = 2)
            except Empty:
                continue

            self._current_booster = booster

            self.send_message('booster', booster = RawStrategy.serialize(self._current_booster))

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
                    pack = self._current_booster,
                    pick = pick,
                )

                self._current_booster.pick_number += 1

                if self._current_booster.cubeables:
                    self.boost_out_queue.put(self._current_booster)
                else:
                    self._draft.booster_empty(self._current_booster)
                self._current_booster = None
                break


class SinglePickInterface(DraftInterface):
    pick_type = SinglePickPick

    def perform_pick(self, pick: SinglePickPick) -> bool:
        if pick.cubeable not in self._current_booster.cubeables:
            return False

        _pick = Cube((pick.cubeable,))
        self._current_booster.cubeables -= _pick
        self._pool += _pick

        return True


class BurnInterface(DraftInterface):
    pick_type = BurnPick

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
        finished_callback: t.Callable[[Draft], None],
    ):
        self._key = key

        self._drafters = drafters
        self._pool_specification = pool_specification
        self._infinites = infinites
        self._draft_format = draft_format
        self._reverse = reverse

        self._finished_callback = finished_callback

        self._active_boosters: t.MutableMapping[Booster, bool] = {}
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
                    Booster(booster)
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

    def booster_empty(self, booster: Booster) -> None:
        with self._active_boosters_lock:
            self._active_boosters[booster] = True
            if all(self._active_boosters.values()):
                self._administer_boosters()

    def get_draft_interface(self, drafter: Drafter) -> DraftInterface:
        return self._drafter_interfaces[drafter]

    def _chain_booster_queues(self) -> None:
        for drafter, interface in self._drafter_interfaces.items():
            interface.boost_out_queue = self._drafter_interfaces[
                self._drafters.before(drafter)
                if self._clockwise else
                self._drafters.after(drafter)
            ].booster_queue

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
            booster = player_boosters.pop()
            self._active_boosters[booster] = False
            interface.booster_queue.put(booster)

    def completed(self) -> None:
        self._draft_session.state = DraftSession.DraftState.COMPLETED
        self._draft_session.ended_at = datetime.datetime.now()
        self._draft_session.save(update_fields = ('state', 'ended_at'))
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
