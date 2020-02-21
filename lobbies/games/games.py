from __future__ import annotations

import typing as t

from abc import abstractmethod, ABCMeta

from django.contrib.auth.models import AbstractUser


class OptionsValidationError(Exception):
    pass


class _GameMeta(ABCMeta):
    games_map: t.MutableMapping[str, t.Type[Game]] = {}

    def __new__(mcs, classname, base_classes, attributes):
        klass = type.__new__(mcs, classname, base_classes, attributes)

        if 'name' in attributes:
            mcs.games_map[attributes['name']] = klass

        return klass


class Game(object, metaclass = _GameMeta):
    name: str

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        self._options = options
        self._players = players
        self._finished_callback = callback

    @property
    @abstractmethod
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        pass

    @classmethod
    @abstractmethod
    def get_default_options(cls) -> t.Mapping[str, t.Any]:
        pass

    @classmethod
    @abstractmethod
    def validate_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        pass

    @abstractmethod
    def start(self) -> None:
        pass
