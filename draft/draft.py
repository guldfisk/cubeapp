from __future__ import annotations

import random
import typing as t
import threading

import multiprocessing as ms
import uuid
from queue import Queue, Empty

from magiccube.collections import cubeable
from magiccube.collections.cube import Cube
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap
from mtgorp.db.database import CardDatabase
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.serializeable import Serializeable, serialization_model, Inflator
from mtgorp.models.serilization.strategies.raw import RawStrategy
from ring import Ring
from yeetlong.multiset import Multiset


class Drafter(object):

    def __init__(self, name: str, key: uuid.UUID):
        self._name = name
        self._key = key

    @property
    def key(self) -> uuid.UUID:
        return self._key

    def __eq__(self, other) -> bool:
        return (
            isinstance(other, self.__class__)
            and self._key == other._key
        )

    def __hash__(self) -> int:
        return hash(self._key)


_deserialize_type_map = {
    'Trap': Trap,
    'Ticket': Ticket,
    'Purple': Purple,
}


class Booster(Serializeable):
    _id_counter = 0

    def __init__(self, cubeables: t.Iterable[cubeable]):
        self._cubeables = Multiset(cubeables)
        self._id = self._id_counter
        Booster._id_counter += 1

    @property
    def cubeables(self) -> Multiset[cubeable]:
        return self._cubeables

    @property
    def id(self):
        return self._id

    def serialize(self) -> serialization_model:
        return [
            _cubeable.serialize()
            if isinstance(_cubeable, Serializeable) else
            _cubeable
            for _cubeable in
            self._cubeables
        ]

    @classmethod
    def deserialize(cls, value: serialization_model, inflator: Inflator) -> Booster:
        return cls(
            inflator.inflate(Printing, _value)
            if isinstance(_value, int) else
            _deserialize_type_map[_value['type']].deserialize(_value, inflator)
            for _value in
            value
        )

    def __hash__(self) -> int:
        return hash(self._id)

    def __eq__(self, other: object) -> bool:
        return (
            isinstance(other, self.__class__)
            and self._id == other._id
        )


class DraftInterface(object):
    _current_booster: t.Optional[Booster]

    def __init__(self, drafter: Drafter, db: CardDatabase, draft: Draft):
        super().__init__()
        self._drafter = drafter
        self._db = db
        self._draft = draft

        self.boost_out_queue = Queue()

        self._booster_queue = Queue()
        self._pick_queue = Queue()
        self._in_queue = Queue()
        self._out_queue = Queue()

        self._current_booster_lock = threading.Lock()
        self._current_booster: t.Optional[Booster] = None

        self._terminating = threading.Event()

        self._communicator = threading.Thread(target = self._connection_loop)
        self._booster_pusher = threading.Thread(target = self._booster_loop)

    @property
    def booster_queue(self) -> Queue[Booster]:
        return self._booster_queue

    # @property
    # def in_queue(self):
    #     return self._pick_queue

    @property
    def out_queue(self):
        return self._out_queue

    # def receive_message(self, message: t.Any) -> None:
    #     with self._current_booster_lock:
    #         self._receive_message(message)

    def _receive_message(self, message: t.Any) -> None:
        message_type = message.get('type')

        if message_type == 'current_booster':
            self._out_queue.put(
                {
                    'type': 'current_booster',
                    'booster': (
                        None
                        if self._current_booster is None else
                        RawStrategy.serialize(self._current_booster)
                    )
                }
            )

        elif message_type == 'pick':
            pick = message.get('pick')
            if pick is None:
                # TODO error
                return

            try:
                pick = (
                    self._db.printings[pick]
                    if isinstance(pick, int) else
                    _deserialize_type_map[pick['type']].deserialize(
                        pick,
                        RawStrategy(self._db)
                    )
                )
            except KeyError:
                #TODO error
                return

            self._pick_queue.put(pick)

            # if self._current_booster is None or not pick in self._current_booster:
            #     #TODO error
            #     return

            # self._current_booster.cubeables.remove(pick, 1)
            # #TODO put pick in pool
            # if self._current_booster.cubeables:
            #     self.boost_out_queue.put(self._current_booster)
            # else:
            #     self._draft.booster_empty(self._current_booster)
            # self._current_booster = None

        else:
            pass

    def run(self) -> None:
        self._communicator.start()
        self._booster_pusher.start()

    def stop(self) -> None:
        self._terminating.set()

    def _connection_loop(self) -> None:
        while not self._terminating.is_set():
            try:
                message = self._in_queue.get(timeout = 2)
                with self._current_booster_lock:
                    self._receive_message(message)
            except Empty:
                pass

    def _booster_loop(self) -> None:
        while not self._terminating.is_set():
            try:
                booster = self._booster_queue.get(timeout = 2)
            except Empty:
                continue
            with self._current_booster_lock:
                self._current_booster = booster

            while not self._terminating.is_set():
                try:
                    pick = self._pick_queue.get(timeout = 2)
                except Empty:
                    continue

                if not pick in self._current_booster.cubeables:
                    #TODO error
                    continue

                self._current_booster.cubeables.remove(pick, 1)
                # TODO put pick in pool
                if self._current_booster.cubeables:
                    self.boost_out_queue.put(self._current_booster)
                else:
                    self._draft.booster_empty(self._current_booster)
                self._current_booster = None


class Draft(object):

    def __init__(
        self,
        key: uuid.UUID,
        drafters: Ring[Drafter],
        cube: Cube,
    ):
        self._key = key

        self._drafters = drafters
        self._cube = cube

        cubeables = random.sample(
            self._cube.cubeables,
            len(self._cube.cubeables),
        )

        self._pack_amount_per_player, self._pack_size = self.get_booster_size_amount(
            len(self._cube.cubeables),
            len(self._drafters),
        )

        self._pack_amount = self._pack_amount_per_player * len(self._drafters)

        self._boosters = [
            Booster(
                cubeables.pop()
                for _ in
                range(self._pack_size)
            ) for _ in
            range(self._pack_amount)
        ]

    @property
    def drafters(self) -> t.Iterable[Drafter]:
        return self._drafters.all

    @property
    def key(self) -> uuid.UUID:
        return self._key

    def booster_empty(self, booster: Booster) -> None:
        pass

    @classmethod
    def get_booster_size_amount(cls, cube_size: int, amount_players: int) -> t.Tuple[int, int]:
        amount_cards_per_player = 90 - (amount_players - 2) * (45 / 6)
        pack_size = amount_players * 2 - 1
        amount_packs = amount_cards_per_player // pack_size
        amount_packs -= max(((amount_packs * pack_size) - cube_size) // pack_size, 0)
        return int(amount_packs), int(pack_size)

    def start(self) -> None:
        pass


class ConnectionInterface(object):
    pass
