import re
import typing as t

from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model

from utils.consumers import AuthenticatedConsumer

from lobbies.exceptions import LeaveLobbyException
from lobbies.games.games import Game
from lobbies.games.options import OptionsValidationError
from lobbies.lobbies import (
    LOBBY_MANAGER, CreateLobbyException, JoinLobbyException, ReadyException, StartGameException, SetOptionsException
)
from sealed.game import Sealed
from draft.game import Draft


class LobbyConsumer(AuthenticatedConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def connect(self):
        async_to_sync(self.channel_layer.group_add)(
            LOBBY_MANAGER.group_name,
            self.channel_name,
        )
        self.accept()

    def disconnect(self, code):
        super().disconnect(code)
        if self._token:
            LOBBY_MANAGER.leave_all_lobbies(self.scope['user'])

    def _on_user_authenticated(self, auth_token: t.AnyStr, user: get_user_model()) -> None:
        self._send_message(
            'all_lobbies',
            lobbies = [
                lobby.serialize_with_key(self.scope['user'])
                for lobby in
                LOBBY_MANAGER.get_lobbies().values()
            ],
        )

    def _receive_message(self, message_type: str, content: t.Any) -> None:
        if message_type == 'create':
            name = content.get('name')
            game_type = content.get('game_type', 'sealed')
            lobby_options = content.get('lobby_options', {})
            game_options = content.get('game_options', {})

            if not isinstance(lobby_options, t.Mapping):
                self._send_error('invalid lobby options')
                return

            if not isinstance(game_options, t.Mapping):
                self._send_error('invalid game options')
                return

            if (
                name is None
                or not re.match('[a-z0-9_]+', name, re.IGNORECASE)
            ):
                self._send_error(f'invalid name "{name}"')
                return

            try:
                game_type = Game.optioneds_map[game_type]
            except KeyError:
                self._send_error(f'invalid game type "{game_type}"')
                return

            try:
                LOBBY_MANAGER.create_lobby(
                    name = name,
                    user = self.scope['user'],
                    lobby_options = lobby_options,
                    game_type = game_type,
                    game_options = game_options,
                )
            except (CreateLobbyException, OptionsValidationError) as e:
                self._send_error(str(e))

        elif message_type == 'join':
            name = content.get('name')
            if name is None or not re.match('[a-z0-9_]', name, re.IGNORECASE):
                self._send_error('invalid request')
                return
            lobby = LOBBY_MANAGER.get_lobby(name)
            if lobby is None:
                self._send_error('no lobby with that name')
                return
            try:
                lobby.join(self.scope['user'])
            except JoinLobbyException as e:
                self._send_error(str(e))

        elif message_type == 'leave':
            name = content.get('name')
            if name is None or not re.match('[a-z0-9_]', name, re.IGNORECASE):
                self._send_error('invalid request')
                return
            lobby = LOBBY_MANAGER.get_lobby(name)
            if lobby is None:
                self._send_error('no lobby with that name')
                return
            try:
                lobby.leave(self.scope['user'])
            except LeaveLobbyException as e:
                self._send_error(str(e))

        elif message_type == 'ready':
            state = content.get('state')
            if not isinstance(state, bool):
                self._send_error('invalid ready state')
                return
            name = content.get('name')
            if name is None or not re.match('[a-z0-9_]', name, re.IGNORECASE):
                self._send_error('invalid request')
                return
            lobby = LOBBY_MANAGER.get_lobby(name)
            if lobby is None:
                self._send_error('no lobby with that name')
                return
            try:
                lobby.set_ready(self.scope['user'], state)
            except ReadyException as e:
                self._send_error(str(e))

        elif message_type == 'start':
            name = content.get('name')
            if name is None or not re.match('[a-z0-9_]', name, re.IGNORECASE):
                self._send_error('invalid request')
                return
            lobby = LOBBY_MANAGER.get_lobby(name)
            if lobby is None:
                self._send_error('no lobby with that name')
                return
            try:
                lobby.start_game(self.scope['user'])
            except StartGameException as e:
                self._send_error(str(e))

        elif message_type == 'game_type':
            name = content.get('name')
            if name is None or not re.match('[a-z0-9_]', name, re.IGNORECASE):
                self._send_error('invalid request')
                return
            lobby = LOBBY_MANAGER.get_lobby(name)
            if lobby is None:
                self._send_error('no lobby with that name')
                return
            game_type = content.get('game_type')
            try:
                game_type = Game.optioneds_map[game_type]
            except KeyError:
                self._send_error(f'invalid game type "{game_type}"')
                return
            options = content.get('options', {})
            if not isinstance(options, t.Mapping):
                self._send_error(f'invalid options')
            try:
                lobby.set_game_type(self.scope['user'], game_type, options)
            except OptionsValidationError as e:
                self._send_error(str(e))

        elif message_type == 'options':
            name = content.get('name')
            if name is None or not re.match('[a-z0-9_]', name, re.IGNORECASE):
                self._send_error('invalid request')
                return
            lobby = LOBBY_MANAGER.get_lobby(name)
            if lobby is None:
                self._send_error('no lobby with that name')
                return
            options = content.get('options')
            if options is None or not isinstance(options, t.Mapping):
                self._send_error('invalid options')
                return
            try:
                lobby.set_options(self.scope['user'], options)
            except (SetOptionsException, OptionsValidationError) as e:
                self._send_error(str(e))

        else:
            self._send_error('unknown command')

    def lobby_created(self, event) -> None:
        self.send_json(
            {
                'type': 'lobby_created',
                **event,
            }
        )

    def lobby_update(self, event) -> None:
        self.send_json(
            {
                'type': 'lobby_update',
                **event,
            }
        )

    def lobby_closed(self, event) -> None:
        self.send_json(
            {
                'type': 'lobby_closed',
                **event,
            }
        )

    def game_started(self, event) -> None:
        self.send_json(
            {
                'type': 'game_started',
                'lobby': event['lobby'],
                'key': event['keys'].get(self.scope['user'].username),
            }
        )
