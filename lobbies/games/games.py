import typing as t

from abc import ABC, abstractmethod

from django.contrib.auth.models import AbstractUser


class OptionsValidationError(Exception):
    pass


class Game(ABC):

    @classmethod
    @abstractmethod
    def validate_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        pass

    @abstractmethod
    def start(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
    ) -> t.Mapping[AbstractUser, t.Mapping[str, t.Any]]:
        pass
