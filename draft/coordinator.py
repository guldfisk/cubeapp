from __future__ import annotations

import threading
import typing as t
import uuid

from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User as DjangoUser

from ring import Ring

from magiccube.collections.cube import Cube

from draft.draft import Draft, Drafter, DraftInterface

from resources.staticdb import db


User: DjangoUser = get_user_model()


class DraftSlot(object):

    class ConnectionException(Exception):
        pass

    def __init__(self, draft: Draft, drafter: Drafter):
        self._draft: Draft = draft
        self._drafter = drafter
        self._consumer: t.Optional[WebsocketConsumer] = None

        self._lock = threading.Lock()

    @property
    def draft(self) -> Draft:
        return self._draft

    @property
    def drafter(self) -> Drafter:
        return self._drafter

    @property
    def consumer(self) -> t.Optional[WebsocketConsumer]:
        with self._lock:
            return self._consumer

    @property
    def interface(self) -> DraftInterface:
        return self._draft.get_draft_interface(self._drafter)

    def connect(self, consumer: WebsocketConsumer) -> None:
        with self._lock:
            if self._consumer is not None:
                raise self.ConnectionException('already connected')
            self._consumer = consumer

    def disconnect(self) -> None:
        with self._lock:
            if self._consumer is None:
                raise self.ConnectionException('no consumer connected')
            self._consumer = None

    def __hash__(self) -> int:
        return hash((self._draft, self._drafter))

    def __eq__(self, other):
        return (
            isinstance(other, self.__class__)
            and self._draft == other._draft
            and self._drafter == other._drafter
        )


class DraftCoordinator(object):

    def __init__(self):
        # self._drafts: t.MutableMapping[Draft, t.FrozenSet[Drafter]] = {}
        # self._drafts: t.MutableMapping[uuid.UUID, Draft] = {}
        self._drafts: t.MutableSet[Draft] = set()
        self._drafters: t.MutableMapping[uuid.UUID, DraftSlot] = {}

        self._lock = threading.Lock()

    # def get_draft(self, key: uuid.UUID) -> t.Optional[Draft]:
    #     with self._lock:
    #         return self._drafts.get(key)

    def get_draft_slot(self, key: uuid.UUID) -> t.Optional[DraftSlot]:
        with self._lock:
            return self._drafters.get(key)

    def start_draft(self, users: t.Iterable[User], cube: Cube) -> t.Tuple[t.Tuple[User, Drafter], ...]:
        print('start draft')
        drafters = tuple(
            (
                user,
                Drafter(
                    user.username,
                    # uuid.uuid4(),
                    uuid.UUID('13fc7b25-4c47-4f34-91ef-21ab17fab8f4'),
                ),
            )
            for user in
            users
        )
        print('drafters', drafters)
        drafters_ring = Ring(
            drafter
            for _, drafter in
            drafters
        )
        draft = Draft(
            uuid.uuid4(),
            drafters_ring,
            cube,
            db = db,
        )
        print('draft', draft)

        with self._lock:
            self._drafts.add(draft)

            for drafter in drafters_ring.all:
                self._drafters[drafter.key] = DraftSlot(
                    draft,
                    drafter,
                )

        draft.start()
        print('started')

        return drafters

    # def connect_drafter(self, draft_slot: DraftSlot, consumer: WebsocketConsumer) -> None:
    #     with self._lock:
    #         draft_slot._consumer = consumer
    #
    # def disconnect_drafter(self, draft_slot: DraftSlot) -> None:
    #     with self._lock:
    #         draft_slot._consumer = None

    def draft_complete(self, draft) -> None:
        with self._lock:
            for drafter in draft.drafters:
                del self._drafters[drafter.key]
            self._drafts.discard(draft)


DRAFT_COORDINATOR = DraftCoordinator()
