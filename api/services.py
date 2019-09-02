import typing as t

import threading

from magiccube.laps.traps.distribute.algorithm import Distributor
from magiccube.laps.traps.distribute.distribute import DistributionTask


class DistributorService(threading.Thread):

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)

        self._task_lock = threading.Lock()
        self._communication_lock = threading.Lock()

        self._task: t.Optional[DistributionTask] = None
        self._release_id: t.Optional[int] = None

    def connect(self, release_id: int) -> t.Optional[DistributionTask]:
        with self._communication_lock:
            if release_id == self._release_id:
                return self._task
            else:
                return None

    def submit_distributor(
        self,
        release_id: int,
        distributor: Distributor,
    ) -> t.Tuple[t.Optional[DistributionTask], int]:
        with self._communication_lock:
            if self._task is None or not self._task.is_alive():
                self._task = DistributionTask(
                    distributor,
                    max_generations = 3000,
                )
                self._release_id = release_id
                self._task.start()
                return self._task, release_id
            else:
                return self._task, self._release_id


DISTRIBUTOR_SERVICE = DistributorService(daemon = True)
DISTRIBUTOR_SERVICE.start()