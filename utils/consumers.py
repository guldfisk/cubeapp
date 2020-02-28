import typing as t

import queue
import threading

from channels.generic.websocket import JsonWebsocketConsumer
from django.contrib.auth import get_user_model
from knox.auth import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


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


class AuthenticatedConsumer(MessageConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._token: t.Optional[t.ByteString] = None

    def _on_user_authenticated(self, auth_token: t.AnyStr, user: get_user_model()) -> None:
        pass

    def _receive_message(self, message_type: str, content: t.Any) -> None:
        pass

    def receive_json(self, content, **kwargs):
        print('recv', self.__class__.__name__, content)

        message_type = content.get('type')

        if message_type is None:
            self._send_error('No Message type')
            return

        if message_type == 'authentication':
            knox_auth = TokenAuthentication()

            if not isinstance(content['token'], str):
                self._send_message('authentication', state = 'failure', reason = 'invalid token field')

            else:
                try:
                    user, auth_token = knox_auth.authenticate_credentials(content['token'].encode('UTF-8'))
                except AuthenticationFailed:
                    user, auth_token = None, None
                if user is not None:
                    self._token = auth_token
                    self.scope['user'] = user
                    self._send_message('authentication', state = 'success')
                    self._on_user_authenticated(auth_token, user)
                else:
                    self._send_message('authentication', state = 'failure', reason = 'invalid token')
            return

        if self._token is None:
            self._send_error('not logged in')
            return

        self._receive_message(message_type, content)
