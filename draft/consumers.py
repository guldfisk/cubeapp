import typing as t

from draft.coordinator import DRAFT_COORDINATOR
from draft.draft import DraftInterface

from utils.consumers import QueueConsumer, MessageConsumer


class DraftConsumer(MessageConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._message_consumer: t.Optional[QueueConsumer] = None
        self._draft_interface: t.Optional[DraftInterface] = None

    def receive_json(self, content, **kwargs):
        self._draft_interface.receive_message(content)

    def connect(self):
        interface_id = self.scope['url_route']['kwargs']['draft_id']

        draft_interface = DRAFT_COORDINATOR.get_draft_interface(interface_id)
        if draft_interface is None:
            return

        try:
            draft_interface.connect(self)
        except DraftInterface.ConnectionException:
            return

        self._draft_interface = draft_interface
        self.accept()
        if self._draft_interface.messages:
            self._send_message(
                'previous_messages',
                messages = self._draft_interface.messages,
            )
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
        if not message['type'] == 'error':
            self._draft_interface.messages.append(message)
        self.send_json(message)
