import typing as t

import threading

from magiccube.laps.traps.distribute.algorithm import Distributor
from magiccube.laps.traps.distribute.distribute import DistributionTask


class DistributorService(threading.Thread):

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)

        self._task_lock = threading.Lock()
        self._communication_lock = threading.Lock()

        self._task: t.Optional[threading.Thread] = None

    def submit_distributor(self, distributor: Distributor) -> t.Optional[DistributionTask]:
        with self._communication_lock:
            if self._task is None or not self._task.is_alive():
                self._task = DistributionTask(
                    distributor,
                    max_generations = 3000,
                )
                self._task.start()
                return self._task
            else:
                return None


DISTRIBUTOR_SERVICE = DistributorService(daemon = True)
DISTRIBUTOR_SERVICE.start()