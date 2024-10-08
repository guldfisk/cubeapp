from __future__ import annotations

import copy
import typing as t
from enum import Enum
from threading import Lock

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels_redis.core import RedisChannelLayer
from django.contrib.auth.models import AbstractUser

from lobbies.exceptions import (
    CreateLobbyException,
    JoinLobbyException,
    LeaveLobbyException,
    ReadyException,
    SetOptionsException,
    StartGameException,
)
from lobbies.games import options as lobbyoptions
from lobbies.games.games import Game
from lobbies.games.options import Optioned


class LobbyState(Enum):
    PRE_GAME = "pre-game"
    GAME = "game"
    POST_GAME = "post-game"


class LobbyManager(object):
    def __init__(self):
        self._lock = Lock()
        self._lobbies: t.MutableMapping[str, Lobby] = {}

        self._channel_layer = get_channel_layer()

    @property
    def group_name(self):
        return "lobby_manager"

    @property
    def channel_layer(self) -> RedisChannelLayer:
        return self._channel_layer

    def get_lobbies(self) -> t.Mapping[str, Lobby]:
        with self._lock:
            return copy.copy(self._lobbies)

    def get_lobby(self, name: str) -> t.Optional[Lobby]:
        with self._lock:
            return self._lobbies.get(name)

    def leave_all_lobbies(self, user: AbstractUser, force: bool = False):
        with self._lock:
            lobbies = list(self._lobbies.values())
        for lobby in lobbies:
            if (lobby.state != LobbyState.GAME or force) and user in lobby.users:
                lobby.leave(user)

    def create_lobby(
        self,
        name: str,
        user: AbstractUser,
        lobby_options: t.Mapping[str, t.Any],
        game_type: t.Type[Game],
        game_options: t.Mapping[str, t.Any],
    ) -> Lobby:
        with self._lock:
            if name in self._lobbies:
                raise CreateLobbyException("lobby already exists")

            try:
                lobby = Lobby(
                    manager=self,
                    name=name,
                    owner=user,
                    game_type=game_type,
                    options=lobby_options,
                )
                lobby.game_options.update(lobby.game_type.validate_options(game_options, silent=True))
            except SetOptionsException as e:
                raise CreateLobbyException(e)

            self._lobbies[name] = lobby

            async_to_sync(self._channel_layer.group_send)(
                self.group_name,
                {
                    "type": "lobby_created",
                    "lobby": lobby.serialize(),
                },
            )

            return lobby


class Lobby(Optioned):
    size: int = lobbyoptions.IntegerOption(min=1, max=64, default=8)
    minimum_size: int = lobbyoptions.IntegerOption(min=0, max=64, default=0)
    require_ready: bool = lobbyoptions.BooleanOption(default=True)
    unready_on_change: bool = lobbyoptions.BooleanOption(default=True)

    def __init__(
        self,
        manager: LobbyManager,
        name: str,
        owner: AbstractUser,
        game_type: t.Type[Game],
        options: t.Optional[t.Mapping[str, t.Any]] = None,
    ):
        super().__init__(options)
        self._manager = manager
        self._name = name
        self._owner = owner
        self._game_type = game_type
        self._game_options = game_type.get_default_options()

        self._state: LobbyState = LobbyState.PRE_GAME
        self._users: t.MutableMapping[AbstractUser, bool] = {self._owner: False}
        self._keys: t.MutableMapping[AbstractUser, str] = {}

        self._lock = Lock()
        self._channel_layer = get_channel_layer()
        self._group_name = "lobby_{}".format(self._name)

    @property
    def name(self) -> str:
        return self._name

    @property
    def users(self) -> t.AbstractSet[AbstractUser]:
        return self._users.keys()

    @property
    def state(self) -> LobbyState:
        return self._state

    @property
    def game_options(self) -> t.MutableMapping[str, t.Any]:
        return self._game_options

    @property
    def game_type(self) -> t.Type[Game]:
        return self._game_type

    def _serialize_user(self, user: AbstractUser) -> t.Any:
        return {
            "username": user.username,
            "ready": self._users[user],
        }

    def serialize(self) -> t.Any:
        return {
            "name": self._name,
            "owner": self._owner.username,
            "state": self._state.value,
            "lobby_options": self._options,
            "users": list(map(self._serialize_user, self._users)),
            "game_type": self._game_type.name,
            "game_options": self._game_options,
        }

    def serialize_with_key(self, user: AbstractUser):
        return {
            "key": self._keys.get(user),
            **self.serialize(),
        }

    def set_ready(self, user: AbstractUser, ready: bool) -> None:
        with self._lock:
            if self._state != LobbyState.PRE_GAME:
                raise ReadyException("cannot change ready status after pre-game")

            previous_value = self._users.get(user)

            if previous_value is not None and previous_value != ready:
                self._users[user] = ready
                async_to_sync(self._manager.channel_layer.group_send)(
                    self._manager.group_name,
                    {
                        "type": "lobby_update",
                        "lobby": self.serialize(),
                    },
                )

    def set_game_type(self, user: AbstractUser, game_type: t.Type[Game], options: t.Mapping[str, t.Any]) -> None:
        if user != self._owner:
            raise SetOptionsException("only lobby owner can modify game_type")

        if self._state != LobbyState.PRE_GAME:
            raise SetOptionsException("cannot modify game_type after pre-game")

        validated_options = game_type.validate_options(options, silent=True)

        with self._lock:
            self._game_type = game_type
            self._game_options = self._game_type.get_default_options()
            self._game_options.update(validated_options)

            if self.unready_on_change:
                for user in self._users:
                    self._users[user] = False

            async_to_sync(self._manager.channel_layer.group_send)(
                self._manager.group_name,
                {
                    "type": "lobby_update",
                    "lobby": self.serialize(),
                },
            )

    def set_options(self, user: AbstractUser, options: t.Mapping[str, t.Any]) -> None:
        if user != self._owner:
            raise SetOptionsException("only lobby owner can modify lobby options")

        if self._state != LobbyState.PRE_GAME:
            raise SetOptionsException("cannot modify options after pre-game")

        with self._lock:
            self._game_options.update(self._game_type.validate_options(options))

            if self.unready_on_change:
                for user in self._users:
                    self._users[user] = False

            async_to_sync(self._manager.channel_layer.group_send)(
                self._manager.group_name,
                {
                    "type": "lobby_update",
                    "lobby": self.serialize(),
                },
            )

    def _game_finished(self) -> None:
        with self._lock:
            self._state = LobbyState.POST_GAME

            async_to_sync(self._manager.channel_layer.group_send)(
                self._manager.group_name,
                {
                    "type": "lobby_update",
                    "lobby": self.serialize(),
                },
            )

    def start_game(self, user: AbstractUser) -> None:
        with self._lock:
            if user != self._owner:
                raise StartGameException("not allowed: only lobby owner can start game")

            if self._state != LobbyState.PRE_GAME:
                raise StartGameException("cannot start game after pre-game")

            if len(self._users) < self.minimum_size:
                raise StartGameException("not allowed: minimum users not present")

            if self.require_ready and not all(self._users.values()):
                raise StartGameException("not allowed: not all users ready")

            game = self._game_type(
                options=self._game_options,
                players=self._users.keys(),
                callback=self._game_finished,
            )

            self._keys = game.keys

            self._state = LobbyState.GAME

            async_to_sync(self._manager.channel_layer.group_send)(
                self._manager.group_name,
                {
                    "type": "game_started",
                    "lobby": self.serialize(),
                    "keys": {user.username: key for user, key in self._keys.items()},
                },
            )

        game.start()

    def join(self, user: AbstractUser) -> None:
        with self._lock:
            if self._state != LobbyState.PRE_GAME:
                raise JoinLobbyException("cannot join lobby not in pre-game")

            if len(self._users) >= self.size:
                raise JoinLobbyException("lobby is full")

            if user in self._users:
                raise JoinLobbyException("already joined lobby")

            self._users[user] = False

            if self.unready_on_change:
                for user in self._users:
                    self._users[user] = False

            async_to_sync(self._manager.channel_layer.group_send)(
                self._manager.group_name,
                {
                    "type": "lobby_update",
                    "lobby": self.serialize(),
                },
            )

    def leave(self, user: AbstractUser) -> None:
        with self._lock:
            if user not in self._users:
                raise LeaveLobbyException("cannot leave lobby without being in it")

            del self._users[user]

            if self.unready_on_change:
                for user in self._users:
                    self._users[user] = False

            if self._users and self._owner in self._users:
                async_to_sync(self._manager.channel_layer.group_send)(
                    self._manager.group_name,
                    {
                        "type": "lobby_update",
                        "lobby": self.serialize(),
                    },
                )
            else:
                with self._manager._lock:
                    del self._manager._lobbies[self._name]
                    async_to_sync(self._manager.channel_layer.group_send)(
                        self._manager.group_name,
                        {
                            "type": "lobby_closed",
                            "name": self._name,
                        },
                    )


LOBBY_MANAGER: LobbyManager = LobbyManager()
