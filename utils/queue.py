import threading
import typing as t
from queue import Full
from queue import Queue as _Queue
from time import time


class Queue(_Queue):
    not_full: threading.Condition
    unfinished_tasks: threading.Condition
    not_empty: threading.Condition

    def put(self, item: t.Any, block: bool = ..., timeout: t.Optional[float] = ...) -> int:
        with self.not_full:
            if self.maxsize > 0:
                if not block:
                    if self._qsize() >= self.maxsize:
                        raise Full
                elif timeout is None:
                    while self._qsize() >= self.maxsize:
                        self.not_full.wait()
                elif timeout < 0:
                    raise ValueError("'timeout' must be a non-negative number")
                else:
                    endtime = time() + timeout
                    while self._qsize() >= self.maxsize:
                        remaining = endtime - time()
                        if remaining <= 0.0:
                            raise Full
                        self.not_full.wait(remaining)
            self._put(item)
            self.unfinished_tasks += 1
            self.not_empty.notify()
            return self._qsize()
