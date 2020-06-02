from __future__ import annotations

import typing as t

from abc import abstractmethod

from django.contrib.auth.models import AbstractUser

from lobbies.games.options import Optioned


class Game(Optioned):
    name: str
    optioneds_map: t.Mapping[str, t.Type[Game]]

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        super().__init__(options)
        self._players = players
        self._finished_callback = callback

    @property
    @abstractmethod
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        pass

    @abstractmethod
    def start(self) -> None:
        pass
