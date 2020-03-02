from __future__ import annotations

import threading
import typing as t
import uuid

from django.contrib.auth.models import AbstractUser

from ring import Ring

from api.models import CubeRelease

from draft.draft import Draft, Drafter, DraftInterface


class DraftCoordinator(object):

    def __init__(self):
        self._drafts: t.MutableSet[Draft] = set()
        self._drafters: t.MutableMapping[str, DraftInterface] = {}

        self._lock = threading.Lock()

    def get_draft_interface(self, key: str) -> t.Optional[DraftInterface]:
        with self._lock:
            return self._drafters.get(key)

    def start_draft(
        self,
        users: t.Iterable[AbstractUser],
        release: CubeRelease,
        pack_amount: int,
        pack_size: int,
        draft_format: str,
    ) -> t.Tuple[t.Tuple[AbstractUser, Drafter], ...]:
        print('start draft')

        drafters = tuple(
            (
                user,
                Drafter(
                    user,
                    str(uuid.uuid4()),
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
            key = str(uuid.uuid4()),
            drafters = drafters_ring,
            release = release,
            pack_amount = pack_amount,
            pack_size = pack_size,
            draft_format = draft_format,
            finished_callback = self.draft_complete,
        )

        draft.start()
        print('started', draft)

        with self._lock:
            self._drafts.add(draft)

            for drafter in drafters_ring.all:
                self._drafters[drafter.key] = draft.get_draft_interface(drafter)

            print(self._drafters)

        return drafters

    def draft_complete(self, draft) -> None:
        with self._lock:
            for drafter in draft.drafters:
                del self._drafters[drafter.key]
            self._drafts.discard(draft)


DRAFT_COORDINATOR = DraftCoordinator()
