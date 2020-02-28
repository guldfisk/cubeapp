from __future__ import annotations

import random
import typing as t
import threading

import uuid
from queue import Queue, Empty

from channels.generic.websocket import WebsocketConsumer

from magiccube.collections import cubeable
from magiccube.collections.cube import Cube
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.serializeable import Serializeable, serialization_model, Inflator
from mtgorp.models.serilization.strategies.raw import RawStrategy
from resources.staticdb import db
from ring import Ring
from yeetlong.multiset import Multiset


class Drafter(object):

    def __init__(self, name: str, key: str):
        self._name = name
        self._key = key

    @property
    def name(self) -> str:
        return self._name

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
            self._name,
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

    @property
    def booster_queue(self) -> Queue[Booster]:
        return self._booster_queue

    @property
    def pick_queue(self) -> Queue[cubeable]:
        return self._pick_queue

    @property
    def out_queue(self):
        return self._out_queue

    def receive_message(self, message: t.Any) -> None:
        message_type = message.get('type')

        if message_type == 'pick':
            pick = message.get('pick')
            if pick is None:
                # TODO error
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
                #TODO error
                return

            self._pick_queue.put(pick)

        else:
            pass

    def start(self) -> None:
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

            self._out_queue.put(
                {
                    'type': 'booster',
                    'booster': RawStrategy.serialize(self._current_booster),
                }
            )

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
                    # TODO error
                    continue

                self._current_booster.cubeables.remove(pick, 1)
                # TODO put pick in pool
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
        cube: Cube,
        pack_amount: int,
        pack_size: int,
        draft_format: str,
    ):
        self._key = key

        self._drafters = drafters
        self._cube = cube

        cubeables = random.sample(
            self._cube.cubeables,
            len(self._cube.cubeables),
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
            range(self._pack_amount)
        ]

        self._drafter_interfaces: t.MutableMapping[Drafter, DraftInterface] = {}

    @property
    def drafters(self) -> t.Iterable[Drafter]:
        return self._drafters.all

    @property
    def key(self) -> str:
        return self._key

    def booster_empty(self, booster: Booster) -> None:
        pass

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

    def _chain_booster_queue(self, clockwise: bool) -> None:
        for drafter, interface in self._drafter_interfaces.items():
            interface.boost_out_queue = self._drafter_interfaces[
                self._drafters.after(
                    drafter
                )
            ].booster_queue

    def _administer_boosters(self) -> None:
        for interface in self._drafter_interfaces.values():
            interface.booster_queue.put(
                self._boosters.pop()
            )

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

        self._chain_booster_queue(True)
        self._administer_boosters()
        print('draft started')


class ConnectionInterface(object):
    pass
