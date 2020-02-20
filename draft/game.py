import typing as t

from django.contrib.auth.models import AbstractUser

from lobbies.games.games import Game


class Draft(Game):
    name = 'draft'

    @classmethod
    def get_default_options(cls) -> t.Mapping[str, t.Any]:
        return {}

    @classmethod
    def validate_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        return options

    def start(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
    ) -> t.Mapping[AbstractUser, str]:
        pass
