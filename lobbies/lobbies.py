from __future__ import annotations

import typing as t

import copy
import uuid

from threading import Lock

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer, BaseChannelLayer
from channels_redis.core import RedisChannelLayer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser


class LobbyException(Exception):
    pass


class CreateLobbyException(LobbyException):
    pass


# class LobbyAlreadyExists(CreateLobbyException):
#     pass


class JoinLobbyException(LobbyException):
    pass


class LobbyManager(object):

    def __init__(self):
        self._lock = Lock()
        self._lobbies: t.MutableMapping[str, Lobby] = {}

        self._channel_layer = get_channel_layer()

    @property
    def group_name(self):
        return 'lobby_manager'

    @property
    def channel_layer(self) -> RedisChannelLayer:
        return self._channel_layer

    def get_lobbies(self) -> t.Mapping[str, Lobby]:
        with self._lock:
            return copy.copy(
                self._lobbies
            )

    def get_lobby(self, name: str) -> t.Optional[Lobby]:
        with self._lock:
            return self._lobbies.get(name)

    def create_lobby(self, name: str, user: AbstractUser, size: int) -> Lobby:
        print('try create lobby', name, user, size)
        if size not in range(1, 64):
            raise CreateLobbyException('illegal lobby size')

        with self._lock:
            if name in self._lobbies:
                raise CreateLobbyException('lobby already exists')

            lobby = Lobby(self, name, user, size)
            self._lobbies[name] = lobby

            print('lobby', lobby)

            async_to_sync(self._channel_layer.group_send)(
                self.group_name,
                {
                    'type': 'lobby_created',
                    'lobby': lobby.serialize(),
                },
            )

            print('looby created, notification send')

            lobby.join(user)
            print('lobby created success')

            return lobby


class Lobby(object):

    def __init__(self, manager: LobbyManager, name: str, owner: AbstractUser, size: int):
        self._manager = manager
        self._name = name
        self._owner = owner
        self._size = size

        self._users: t.MutableSet[AbstractUser] = set()

        self._lock = Lock()
        # self._channel_layer = get_channel_layer()
        # self._group_name = 'lobby_{}'.format(
        #     self._name
        # )

    @property
    def name(self) -> str:
        return self._name

    @property
    def users(self) -> t.AbstractSet[AbstractUser]:
        with self._lock:
            return copy.copy(self._users)

    def serialize(self) -> t.Any:
        return {
            'name': self._name,
            'owner': self._owner.username,
            'size': self._size,
            'users': [
                user.username
                for user in
                self._users
            ],
        }

    def join(self, user: AbstractUser) -> None:
        print('joining')
        with self._lock:
            print('after lock')
            if len(self._users) >= self._size:
                raise JoinLobbyException('lobby is full')

            # async_to_sync(self._channel_layer.group_add)(
            #     self._group_name,
            #     channel_name,
            # )
            self._users.add(user)
            print('user added')
            async_to_sync(self._manager.channel_layer.group_send)(
                self._manager.group_name,
                {
                    'type': 'lobby_update',
                    'lobby': self.serialize(),
                },
            )
        print('join complete')

    def leave(self, user: AbstractUser) -> None:
        with self._lock:
            # async_to_sync(self._channel_layer.group_discard)(
            #     self._group_name,
            #     channel_name,
            # )
            self._users.remove(user)
            if self._users and self._owner in self._users:
                async_to_sync(self._manager.channel_layer.group_send)(
                    self._manager.group_name,
                    {
                        'type': 'lobby_update',
                        'lobby': self.serialize(),
                    },
                )
            else:
                print('lobby abandoned')
                with self._manager._lock:
                    del self._manager._lobbies[self._name]
                    async_to_sync(self._manager.channel_layer.group_send)(
                        self._manager.group_name,
                        {
                            'type': 'lobby_closed',
                            'name': self._name,
                        },
                    )


LOBBY_MANAGER: LobbyManager = LobbyManager()
