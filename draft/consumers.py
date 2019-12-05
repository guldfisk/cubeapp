import typing as t

import threading
import queue
import uuid
from collections import OrderedDict

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError
from knox.auth import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

from draft.coordinator import DRAFT_COORDINATOR, DraftSlot
from magiccube.collections.laps import TrapCollection
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.distribute.delta import DeltaDistributor
from magiccube.laps.traps.trap import Trap

from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.serilization.strategies.raw import RawStrategy

from magiccube.collections.meta import MetaCube
from magiccube.laps.traps.distribute import algorithm
from magiccube.laps.traps.distribute.algorithm import Distributor, TrapDistribution, TrapCollectionIndividual
from magiccube.update import cubeupdate
from magiccube.update.cubeupdate import CubePatch, CubeUpdater, CUBE_CHANGE_MAP
from magiccube.update.report import UpdateReport

from resources.staticdb import db


class QueueConsumer(threading.Thread):

    def __init__(
        self,
        q: queue.Queue,
        callback: t.Callable[[t.Dict[str, t.Any]], None],
        **kwargs,
    ) -> None:
        super().__init__(**kwargs)
        self._q = q
        self._callback = callback
        self._terminating = threading.Event()

    def stop(self) -> None:
        self._terminating.set()

    def run(self) -> None:
        while not self._terminating.is_set():
            try:
                self._callback(
                    self._q.get(timeout = 5)
                )
            except queue.Empty:
                pass


class MessageConsumer(JsonWebsocketConsumer):

    def _send_message(self, message_type: str, **kwargs):
        print('send message', message_type, kwargs)
        d = {'type': message_type}
        d.update(kwargs)
        self.send_json(d)

    def _send_error(self, message: t.Any):
        print('send error', message)
        self.send_json(
            {
                'type': 'error',
                'message': message,
            }
        )


_deserialize_type_map = {
    'Trap': Trap,
    'Ticket': Ticket,
    'Purple': Purple,
}


class DraftConsumer(MessageConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._message_consumer: t.Optional[QueueConsumer] = None
        self._draft_slot: t.Optional[DraftSlot] = None

    def _receive_message(self, message_type: str, content: t.Any) -> None:
        pass

    def receive_json(self, content, **kwargs):
        print('recv', self.__class__.__name__, content)

        message_type = content.get('type')

        if message_type is None:
            self._send_error('no command')
            return

        elif message_type == 'pick':
            pick = content.get('pick')
            if pick is None:
                # TODO error
                print('no pick')
                return

            try:
                pick = (
                    db.printings[pick]
                    if isinstance(pick, int) else
                    _deserialize_type_map[pick['type']].deserialize(
                        pick,
                        RawStrategy(db)
                    )
                )
            except KeyError as e:
                print('invalid pick', e)
                # TODO error
                return

            self._draft_slot.interface.pick_queue.put(pick)

        # if self._draft_slot is None:
        #     if message_type == 'join':
        #         try:
        #             draft_id = uuid.UUID(self.scope['url_route']['kwargs']['draft_id'])
        #         except ValueError:
        #             self._send_error('invalid draft id field')
        #             return
        #
        #         draft_slot = DRAFT_COORDINATOR.get_draft_slot(draft_id)
        #         if draft_slot is None:
        #             self._send_error('no draft with that id')
        #
        #         try:
        #             draft_slot.connect(self)
        #         except DraftSlot.ConnectionException:
        #             self._send_error('already connected')
        #             return
        #
        #         self._draft_slot = draft_slot
        #
        #         # else:
        #         #     try:
        #         #         user, auth_token = knox_auth.authenticate_credentials(content['token'].encode('UTF-8'))
        #         #     except AuthenticationFailed:
        #         #         user, auth_token = None, None
        #         #     if user is not None:
        #         #         self._token = auth_token
        #         #         self.scope['user'] = user
        #         #         self._send_message('authentication', state = 'success')
        #         #         self._on_user_authenticated(auth_token, user)
        #         #     else:
        #         #         self._send_message('authentication', state = 'failure', reason = 'invalid token')
        #         # return
        #
        #     else:
        #         self._send_error('no draft joined')
        #         return
        #
        # elif message_type == 'join':
        #     self._send_error('already joined draft')
        #     return

        else:
            self._send_error('unknown command')
        # self._receive_message(message_type, content)

    # def websocket_connect(self, message):
    #     print('ws connect')
    #     print(message)
    #     super().websocket_connect(message)

    def send_json(self, content, close=False):
        print('send json', content)
        super().send_json(content, close)

    def connect(self):
        try:
            draft_id = uuid.UUID(self.scope['url_route']['kwargs']['draft_id'])
        except ValueError:
            print('invalid draft id field')
            # self._send_error('invalid draft id field')
            return

        draft_slot = DRAFT_COORDINATOR.get_draft_slot(draft_id)
        if draft_slot is None:
            print('no draft with that id')
            # self._send_error('no draft with that id')
            return

        try:
            draft_slot.connect(self)
        except DraftSlot.ConnectionException:
            print('already connected')
            # self._send_error('already connected')
            return

        self._draft_slot = draft_slot
        self.accept()
        self._message_consumer = QueueConsumer(
            self._draft_slot.interface.out_queue,
            self._handle_interface_message,
        )
        self._message_consumer.start()
        # self._draft_slot.draft.get_draft_interface(
        #     self._draft_slot.drafter
        # )

    def disconnect(self, code):
        if self._draft_slot is not None:
            self._draft_slot.disconnect()

        if self._message_consumer is not None:
            self._message_consumer.stop()

    def _handle_interface_message(self, message) -> None:
        print('handle interface message')
        self.send_json(
            message
        )

    # def _on_user_authenticated(self, auth_token: t.AnyStr, user: get_user_model()) -> None:
    #     participating_in = DRAFT_COORDINATOR.user_drafts(user)
    #     if participating_in:
    #         self._send_message(
    #             'reconnect_to',
    #             drafts = [
    #                 str(draft_slot.draft.key)
    #                 for draft_slot in
    #                 participating_in
    #                 if draft_slot.consumer is None
    #             ]
    #         )
    #
    # def _receive_message(self, message_type: str, content: t.Any) -> None:
    #     if message_type == 'join_draft':
    #         pass

from api import models
user = get_user_model().objects.get(username='root')
cube = models.CubeRelease.objects.get(pk=14).cube
drafters = DRAFT_COORDINATOR.start_draft(
    (user,),
    cube,
)
for user, drafter in drafters:
    print(user.username, drafter.key)