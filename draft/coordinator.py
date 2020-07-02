from __future__ import annotations

import threading
import typing as t
import uuid

from django.contrib.auth.models import AbstractUser

from limited.models import PoolSpecification
from ring import Ring

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
        pool_specification: PoolSpecification,
        draft_format: str,
        reverse: bool,
        finished_callback: t.Callable[[Draft], None],
    ) -> t.Tuple[t.Tuple[AbstractUser, Drafter], ...]:

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

        drafters_ring = Ring(
            drafter
            for _, drafter in
            drafters
        )

        def _finished_callback(_draft: Draft):
            self.draft_complete(_draft)
            finished_callback(_draft)

        draft = Draft(
            key = str(uuid.uuid4()),
            drafters = drafters_ring,
            pool_specification = pool_specification,
            draft_format = draft_format,
            finished_callback = _finished_callback,
            reverse = reverse,
        )

        draft.start()

        with self._lock:
            self._drafts.add(draft)

            for drafter in drafters_ring.all:
                self._drafters[drafter.key] = draft.get_draft_interface(drafter)

        return drafters

    def draft_complete(self, draft) -> None:
        with self._lock:
            for drafter in draft.drafters:
                del self._drafters[drafter.key]
            self._drafts.discard(draft)


DRAFT_COORDINATOR = DraftCoordinator()
