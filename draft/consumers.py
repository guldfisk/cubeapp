import typing as t

import uuid

from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap

from draft.coordinator import DRAFT_COORDINATOR
from draft.draft import DraftInterface

from utils.consumers import QueueConsumer, MessageConsumer


_deserialize_type_map = {
    'Trap': Trap,
    'Ticket': Ticket,
    'Purple': Purple,
}


class DraftConsumer(MessageConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._message_consumer: t.Optional[QueueConsumer] = None
        self._draft_interface: t.Optional[DraftInterface] = None

    def _receive_message(self, message_type: str, content: t.Any) -> None:
        pass

    def receive_json(self, content, **kwargs):
        print('recv', self.__class__.__name__, content)
        self._draft_interface.receive_message(content)

    def send_json(self, content, close=False):
        print('send json', content)
        super().send_json(content, close)

    def connect(self):
        interface_id = self.scope['url_route']['kwargs']['draft_id']

        draft_interface = DRAFT_COORDINATOR.get_draft_interface(interface_id)
        if draft_interface is None:
            print('no draft with that id')
            return

        try:
            draft_interface.connect(self)
        except DraftInterface.ConnectionException:
            print('already connected')
            return

        self._draft_interface = draft_interface
        self.accept()
        self._message_consumer = QueueConsumer(
            self._draft_interface.out_queue,
            self._handle_interface_message,
        )
        self._message_consumer.start()

    def disconnect(self, code):
        if self._draft_interface is not None:
            self._draft_interface.disconnect()

        if self._message_consumer is not None:
            self._message_consumer.stop()

    def _handle_interface_message(self, message) -> None:
        print('handle interface message')
        self.send_json(
            message
        )
