import typing as t

from django.contrib.auth.models import AbstractUser

from api.models import CubeRelease
from lobbies.games.games import Game


class Draft(Game):
    name = 'draft'

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        super().__init__(options, players, callback)

    @property
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        pass

    @classmethod
    def get_default_options(cls) -> t.Mapping[str, t.Any]:
        return {
            'pack_size': 15,
            'pack_amount': 3,
            'format': 'limited_sideboard',
            'drafting_format': 'single_pick',
            'release': CubeRelease.objects.filter(
                versioned_cube_id = 1,
            ).order_by(
                'created_at',
            ).values_list('id', flat = True).last(),
        }

    @classmethod
    def validate_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        pass

    def start(self) -> None:
        pass

