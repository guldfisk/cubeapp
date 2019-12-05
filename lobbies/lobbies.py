from __future__ import annotations

import typing as t

import copy

from threading import Lock

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser


class LobbyManager(object):

    class LobbyAlreadyExists(Exception):
        pass

    def __init__(self):
        self._lock = Lock()
        self._lobbies: t.MutableMapping[str, Lobby] = {}

        self._channel_layer = get_channel_layer()

    @property
    def group_name(self):
        return 'lobby_manager'

    def get_lobbies(self) -> t.Mapping[str, Lobby]:
        with self._lock:
            return copy.copy(
                self._lobbies
            )

    def create_lobby(self, name: str, user: AbstractUser, channel_name: str) -> Lobby:
        with self._lock:
            if name in self._lobbies:
                raise self.LobbyAlreadyExists()

            lobby = Lobby(self, name)
            self._lobbies[name] = lobby
            lobby.join(user, channel_name)

            async_to_sync(self._channel_layer.group_send)(
                self.group_name,
                {
                    'type': 'lobby_update',
                    'lobbies': [
                        lobby.name
                        for lobby in
                        self._lobbies.values()
                    ],
                },
            )

            return lobby


class Lobby(object):

    def __init__(self, manager: LobbyManager, name: str):
        self._manager = manager
        self._name = name
        self._users: t.MutableSet[AbstractUser] = set()

        self._lock = Lock()
        self._channel_layer = get_channel_layer()
        self._group_name = 'lobby_{}'.format(
            self._name
        )

    @property
    def name(self) -> str:
        return self._name

    def join(self, user: AbstractUser, channel_name: str) -> None:
        with self._lock:
            async_to_sync(self._channel_layer.group_add)(
                self._group_name,
                channel_name,
            )
            self._users.add(user)
            async_to_sync(self._channel_layer.group_send)(
                self._group_name,
                {
                    'type': 'user_update',
                    'users': [
                        user.username
                        for user in
                        self._users
                    ]
                },
            )

    def leave(self, user: AbstractUser, channel_name: str) -> None:
        with self._lock:
            async_to_sync(self._channel_layer.group_discard)(
                self._group_name,
                channel_name,
            )
            self._users.remove(user)
            if self._users:
                async_to_sync(self._channel_layer.group_send)(
                    self._group_name,
                    {
                        'type': 'user_update',
                        'lobby': self._name,
                        'users': [
                            user.username
                            for user in
                            self._users
                        ]
                    },
                )
            else:
                with self._manager._lock:
                    del self._manager._lobbies[self._name]
                    async_to_sync(self._channel_layer.group_send)(
                        self._manager.group_name,
                        {
                            'type': 'lobby_update',
                            'lobbies': [
                                lobby.name
                                for lobby in
                                self._manager._lobbies.values()
                            ],
                        },
                    )


LOBBY_MANAGER = LobbyManager()
