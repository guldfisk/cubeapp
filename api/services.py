from __future__ import annotations

import copy
import queue
import typing as t

import threading
from collections import defaultdict

from evolution.logging import LogFrame
from magiccube.laps.traps.distribute.algorithm import Distributor
from magiccube.laps.traps.distribute.distribute import DistributionWorker


class DistributionTask(threading.Thread):

    def __init__(self, max_generations: int = 0, **kwargs):
        super().__init__(**kwargs)
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
    def frames(self) -> t.List[LogFrame]:
        with self._lock:
            return self._frames

    @property
    def status(self) -> str:
        with self._lock:
            return self._status

    @property
    def subscribers(self) -> t.KeysView[str]:
        with self._lock:
            return self._subscribers.keys()

    @property
    def is_working(self) -> bool:
        return self._is_working.is_set()

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
            except KeyError:
                pass

    def stop(self):
        self._terminating.set()
        self._worker.stop()

    def submit(self, distributor: Distributor):
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
        while not self._terminating.is_set():
            if self._worker is None and not self._is_working.wait(5):
                continue

            with self._lock:
                try:
                    message = self._worker.message_queue.get(timeout = 5)
                except queue.Empty:
                    continue

                if message['type'] == 'frame':
                    self._frames.append(message['frame'])
                if message['type'] == 'status':
                    self._status = message['status']
                    if message['status'] == 'stopped':
                        self._is_working.clear()

                for subscriber in self._subscribers.values():
                    subscriber.put(message)


class DistributorService(object):

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)

        self._lock = threading.Lock()
        self._tasks: t.Dict[int, DistributionTask] = defaultdict(
            lambda : DistributionTask(max_generations=3000)
        )

        # self._task: t.Optional[DistributionTask] = None
        # self._patch_id: t.Optional[int] = None

    def connect(self, patch_id: int) -> t.Optional[DistributionTask]:
        with self._lock:
            return self._tasks[patch_id]

    def is_patch_locked(self, patch_id: int) -> bool:
        with self._lock:
            return (
                patch_id in self._tasks
                and self._tasks[patch_id].subscribers
            )

    # def submit_distributor(
    #     self,
    #     patch_id: int,
    #     distributor: Distributor,
    # ) -> t.Tuple[t.Optional[DistributionTask], int]:
    #     with self._communication_lock:
    #         if self._task is None or not self._task.is_alive():
    #             self._task = DistributionTask(
    #                 distributor,
    #                 max_generations = 3000,
    #             )
    #             self._patch_id = patch_id
    #             self._task.start()
    #             return self._task, patch_id
    #         else:
    #             return self._task, self._patch_id


DISTRIBUTOR_SERVICE = DistributorService()