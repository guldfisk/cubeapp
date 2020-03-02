from __future__ import annotations

import random
import typing as t
import threading

import uuid
from queue import Queue, Empty

from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth.models import AbstractUser

from api.models import CubeRelease
from api.serialization.serializers import UserSerializer
from magiccube.collections.cube import Cube
from magiccube.collections.cubeable import Cubeable
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.serializeable import Serializeable, serialization_model, Inflator
from mtgorp.models.serilization.strategies.raw import RawStrategy
from resources.staticdb import db
from ring import Ring


def serialize_cubeable(cubeable: Cubeable) -> t.Any:
    return cubeable.id if isinstance(cubeable, Printing) else RawStrategy.serialize(cubeable)


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


_deserialize_type_map = {
    'Trap': Trap,
    'Ticket': Ticket,
    'Purple': Purple,
}


class Booster(Serializeable):

    def __init__(self, cubeables: Cube, booster_id: t.Optional[str] = None):
        self._cubeables = cubeables
        self._booster_id = str(uuid.uuid4()) if booster_id is None else booster_id

    @property
    def cubeables(self) -> Cube:
        return self._cubeables

    @cubeables.setter
    def cubeables(self, cube: Cube) -> None:
        self._cubeables = cube

    @property
    def booster_id(self) -> str:
        return self._booster_id

    def serialize(self) -> serialization_model:
        return {
            'booster_id': self._booster_id,
            'cubeables': self._cubeables.serialize(),
        }

    @classmethod
    def deserialize(cls, value: serialization_model, inflator: Inflator) -> Booster:
        return cls(
            booster_id = value['booster_id'],
            cubeables = Cube.deserialize(value['cubeables'], inflator),
        )

    def __hash__(self) -> int:
        return hash(self._booster_id)

    def __eq__(self, other: object) -> bool:
        return (
            isinstance(other, self.__class__)
            and self._booster_id == other._booster_id
        )


class DraftInterface(object):
    _current_booster: t.Optional[Booster]

    class ConnectionException(Exception):
        pass

    def __init__(self, drafter: Drafter, draft: Draft):
        super().__init__()
        self._drafter = drafter
        self._draft = draft

        self._pool = Cube()

        self._messages: t.List[t.Mapping[str, t.Any]] = []

        self.boost_out_queue = Queue()

        self._booster_queue = Queue()
        self._pick_queue = Queue()
        self._out_queue = Queue()

        self._current_booster_lock = threading.Lock()
        self._current_booster: t.Optional[Booster] = None

        self._terminating = threading.Event()

        self._booster_pusher = threading.Thread(target = self._booster_loop)

        self._connect_lock = threading.Lock()
        self._consumer: t.Optional[WebsocketConsumer] = None

    @property
    def messages(self) -> t.List[t.Mapping[str, t.Any]]:
        return self._messages

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
                pick = (
                    db.printings[pick]
                    if isinstance(pick, int) else
                    _deserialize_type_map[pick['type']].deserialize(
                        pick,
                        RawStrategy(db)
                    )
                )
            except KeyError:
                self.send_error('misconstrued_pick')
                return

            self._pick_queue.put(pick)

        else:
            pass

    def start(self) -> None:
        self.send_message(
            'started',
            draft = self._draft.serialize(),
        )
        self._booster_pusher.start()

    def stop(self) -> None:
        self._terminating.set()

    def _booster_loop(self) -> None:
        while not self._terminating.is_set():
            try:
                booster = self._booster_queue.get(timeout = 2)
            except Empty:
                continue

            with self._current_booster_lock:
                self._current_booster = booster

            self.send_message('booster', booster = RawStrategy.serialize(self._current_booster))

            print(
                'new booster arrived at {}: {}'.format(
                    self._drafter.name,
                    self._current_booster.cubeables,
                )
            )

            while not self._terminating.is_set():
                try:
                    pick = self._pick_queue.get(timeout = 2)
                except Empty:
                    continue

                print(
                    '{} picked {}'.format(
                        self._drafter.name,
                        pick,
                    )
                )

                if pick not in self._current_booster.cubeables:
                    self.send_error('invalid_pick', pick = serialize_cubeable(pick))
                    continue

                _pick = Cube((pick,))
                self._current_booster.cubeables -= _pick
                self._pool += _pick
                self.send_message('pick', pick = serialize_cubeable(pick))

                if self._current_booster.cubeables:
                    self.boost_out_queue.put(self._current_booster)
                    print('pack sent on')
                else:
                    self._draft.booster_empty(self._current_booster)
                    print('pack empty; returned')
                self._current_booster = None
                break


class Draft(object):

    def __init__(
        self,
        key: str,
        drafters: Ring[Drafter],
        release: CubeRelease,
        pack_amount: int,
        pack_size: int,
        draft_format: str,
        finished_callback: t.Callable[[Draft], None],
    ):
        self._key = key

        self._drafters = drafters
        self._release = release
        self._draft_format = draft_format

        self._finished_callback = finished_callback

        self._active_boosters: t.MutableMapping[Booster, bool] = {}
        self._active_boosters_lock = threading.Lock()

        self._clockwise = True

        cubeables = random.sample(
            self._release.cube.cubeables,
            len(self._release.cube.cubeables),
        )

        self._pack_amount = pack_amount
        self._pack_size = pack_size

        self._boosters = [
            Booster(
                Cube(
                    cubeables.pop()
                    for _ in
                    range(self._pack_size)
                )
            ) for _ in
            range(int(self._pack_amount * len(self._drafters)))
        ]

        self._drafter_interfaces: t.MutableMapping[Drafter, DraftInterface] = {}

    @property
    def drafters(self) -> t.Iterable[Drafter]:
        return self._drafters.all

    @property
    def key(self) -> str:
        return self._key

    def serialize(self) -> t.Mapping[str, t.Any]:
        return {
            'drafters': [
                UserSerializer(drafter.user).data
                for drafter in
                self._drafters.all
            ],
            'pack_amount': self._pack_amount,
            'pack_size': self._pack_size,
            'draft_format': self._draft_format,
            'release': self._release.id,
        }

    def booster_empty(self, booster: Booster) -> None:
        with self._active_boosters_lock:
            self._active_boosters[booster] = True
            if all(self._active_boosters.values()):
                self._administer_boosters()

    # @classmethod
    # def get_booster_size_amount(cls, cube_size: int, amount_players: int) -> t.Tuple[int, int]:
    #     # amount_cards_per_player = 90 - (amount_players - 2) * (45 / 6)
    #     # pack_size = amount_players * 2 - 1
    #     # amount_packs = amount_cards_per_player // pack_size
    #     # amount_packs -= max(((amount_packs * pack_size) - cube_size) // pack_size, 0)
    #     # return int(amount_packs), int(pack_size)
    #     return 2, 2

    def get_draft_interface(self, drafter: Drafter) -> DraftInterface:
        return self._drafter_interfaces[drafter]

    def _chain_booster_queues(self) -> None:
        with self._active_boosters_lock:
            for drafter, interface in self._drafter_interfaces.items():
                interface.boost_out_queue = self._drafter_interfaces[
                    self._drafters.after(drafter)
                    if self._clockwise else
                    self._drafters.before(drafter)
                ].booster_queue

            self._clockwise = not self._clockwise

    def _administer_boosters(self) -> None:
        if not self._boosters:
            self.completed()
            return

        self._chain_booster_queues()

        self._active_boosters.clear()
        for interface in self._drafter_interfaces.values():
            booster = self._boosters.pop()
            self._active_boosters[booster] = False
            interface.booster_queue.put(booster)

    def completed(self) -> None:
        self._finished_callback(self)
        for interface in self._drafter_interfaces.values():
            interface.send_message('completed')

    def start(self) -> None:
        print('draft start')
        self._drafter_interfaces = {
            drafter: DraftInterface(
                drafter = drafter,
                draft = self,
            )
            for drafter in
            self._drafters.all
        }
        for interface in self._drafter_interfaces.values():
            interface.start()

        # self._chain_booster_queue(True)
        self._administer_boosters()
        print('draft started')


class ConnectionInterface(object):
    pass
