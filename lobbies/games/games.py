from __future__ import annotations

import typing as t

from abc import abstractmethod, ABCMeta

from django.contrib.auth.models import AbstractUser

from lobbies.games.options import Option


class _GameMeta(ABCMeta):
    games_map: t.MutableMapping[str, t.Type[Game]] = {}
    options_meta: t.Mapping[str, Option]

    def __new__(mcs, classname, base_classes, attributes):
        options = {}

        for key, attribute in attributes.items():
            if isinstance(attribute, Option):
                if attribute._name is None:
                    attribute._name = key
                options[attribute._name] = attribute

        attributes['options_meta'] = options

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
    def get_default_options(cls) -> t.Mapping[str, t.Any]:
        return {
            name: value.default
            for name, value in
            cls.options_meta.items()
        }

    @classmethod
    def validate_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        return {
            option: cls.options_meta[option].validate(value)
            for option, value in
            options.items()
            if option in cls.options_meta
        }

    @abstractmethod
    def start(self) -> None:
        pass
