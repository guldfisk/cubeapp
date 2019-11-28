import re
import typing as t

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.contrib.auth import get_user_model
from knox.auth import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

from lobbies.lobbies import LOBBY_MANAGER, LobbyManager, Lobby


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


class LobbyConsumer(AuthenticatedConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._lobby: t.Optional[Lobby] = None

    def connect(self):
        async_to_sync(self.channel_layer.group_add)(
            LOBBY_MANAGER.group_name,
            self.channel_name,
        )

    def disconnect(self, code):
        super().disconnect(code)
        if self._lobby is not None:
            self._lobby.leave(self.scope['user'], self.channel_name)

    def _receive_message(self, message_type: str, content: t.Any) -> None:
        if message_type == 'list':
            self._send_message(
                'list',
                items = list(
                    LOBBY_MANAGER.get_lobbies().keys()
                ),
            )

        elif message_type == 'create':
            name = content.get('name')
            if name is None or not re.match('[a-z0-9_]', name, re.IGNORECASE):
                self._send_error('invalid request')
                return
            try:
                self._lobby = LOBBY_MANAGER.create_lobby(name, self.scope['user'], self.channel_name)
            except LobbyManager.LobbyAlreadyExists:
                self._send_error('lobby already exists')

    def user_update(self, event) -> None:
        self.send_json(
            {
                'type': 'user_update',
                'content': event['users']
            }
        )