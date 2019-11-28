from __future__ import annotations

import copy
import queue
import typing as t

import threading

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from evolution.environment import Environment
from evolution.logging import LogFrame
from magiccube.laps.traps.distribute.algorithm import TrapDistribution, TrapCollectionIndividual
from magiccube.laps.traps.distribute.distribute import DistributionWorker


class DistributionTask(threading.Thread):

    def __init__(self, callback: t.Callable[[], None], *, max_generations: int = 0, **kwargs):
        super().__init__(**kwargs)
        self._callback = callback

        self._max_generations = max_generations
        self._worker = None

        self._running: bool = False
        self._terminating = threading.Event()
        self._message_queue = queue.Queue()

        self._submit_lock = threading.Lock()
        self._lock = threading.Lock()
        self._is_working = threading.Event()

        self._status: str = 'prerun'
        self._frames: t.List[LogFrame] = []

        self._subscribers: t.Dict[str, queue.Queue[t.Dict[str, t.Any]]] = {}

    @property
    def distribution_worker(self) -> t.Optional[DistributionWorker]:
        return self._worker

    @property
    def frames(self) -> t.List[LogFrame]:
        with self._lock:
            return copy.copy(self._frames)

    @property
    def status(self) -> str:
        with self._lock:
            return self._status

    @property
    def subscribers(self) -> t.FrozenSet[str]:
        with self._lock:
            return frozenset(self._subscribers.keys())

    @property
    def is_working(self) -> bool:
        return self._is_working.is_set()

    def get_latest_fittest(self) -> TrapDistribution:
        with self._lock:
            if self._status != 'paused':
                raise RuntimeError('Task must be paused to get distribution')
            return self._worker.distributor.fittest()

    def subscribe(self, key: str) -> queue.Queue[t.Dict[str, t.Any]]:
        with self._lock:
            q = queue.Queue()
            self._subscribers[key] = q
            q.put(
                {
                    'type': 'previous_messages',
                    'frames': copy.copy(self._frames),
                    'status': self._status,
                }
            )
            return q

    def unsubscribe(self, key: str) -> None:
        with self._lock:
            try:
                del self._subscribers[key]
                if not self._is_working.is_set() and not self._subscribers:
                    self.stop()
            except KeyError:
                pass

    def stop(self):
        self._terminating.set()
        if self._worker:
            self._worker.stop()

    def submit(self, distributor: Environment[TrapCollectionIndividual]):
        if self._is_working.is_set():
            return

        with self._submit_lock:
            self._worker = DistributionWorker(distributor, max_generations=self._max_generations)
            self._frames = []
            self._status = 'prerun'
            self._is_working.set()
            self._worker.start()

    def cancel(self) -> None:
        if not self._is_working.is_set():
            return

        with self._submit_lock:
            self._worker.stop()
            self._is_working.clear()

    def pause(self):
        self._worker.pause()

    def resume(self):
        self._worker.resume()

    def run(self) -> None:
        while not (
            self._terminating.is_set()
            or self._status == 'stopped'
            and not self._subscribers
        ):
            if self._worker is None and not self._is_working.wait(2):
                continue

            try:
                message = self._worker.message_queue.get(timeout = 2)
            except queue.Empty:
                continue

            with self._lock:
                if message['type'] == 'frame':
                    self._frames.append(message['frame'])
                if message['type'] == 'status':
                    self._status = message['status']
                    if message['status'] == 'stopped':
                        self._is_working.clear()

                for subscriber in self._subscribers.values():
                    subscriber.put(message)

        self._callback()


class DistributorService(object):

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)

        self._lock = threading.Lock()
        self._tasks: t.Dict[int, DistributionTask] = {}

    def _distribution_task_complete(self, key):
        with self._lock:
            del self._tasks[key]
            async_to_sync(get_channel_layer().group_send)(
                f'patch_edit_{key}',
                {
                    'type': 'patch_lock',
                    'action': 'release',
                },
            )

    def connect(self, patch_id: int) -> t.Optional[DistributionTask]:
        with self._lock:
            try:
                return self._tasks[patch_id]
            except KeyError:
                async_to_sync(get_channel_layer().group_send)(
                    f'patch_edit_{patch_id}',
                    {
                        'type': 'patch_lock',
                        'action': 'acquirer',
                    },
                )
                distribution_task = DistributionTask(
                    lambda : self._distribution_task_complete(patch_id),
                )
                distribution_task.start()
                self._tasks[patch_id] = distribution_task
                return distribution_task

    def is_patch_locked(self, patch_id: int) -> bool:
        with self._lock:
            return patch_id in self._tasks


DISTRIBUTOR_SERVICE = DistributorService()
