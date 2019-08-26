import typing as t


from channels.generic.websocket import WebsocketConsumer
import json
import threading
import time
import random



class SomeWorker(threading.Thread):

    def __init__(self, callback: t.Callable[[float], None]) -> None:
        super().__init__()
        self._callback = callback
        self._running = False

    def stop(self) -> None:
        self._running = False

    def run(self) -> None:
        self._running = True
        while self._running:
            self._callback(random.random())
            time.sleep(1)



class DistributorConsumer(WebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._worker = SomeWorker(self.send_update)

    def send_update(self, value: float) -> None:
        self.send(
            json.dumps(
                {
                    'message': value
                }
            )
        )

    def connect(self):
        self.accept()
        self._worker.start()

    def disconnect(self, close_code):
        self._worker.stop()
        # pass

    def receive(self, text_data = None, bytes_data = None):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        self.send(
            text_data = json.dumps(
                {
                    'message': message
                }
            )
        )
