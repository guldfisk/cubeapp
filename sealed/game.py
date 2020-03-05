import typing as t

from django.contrib.auth.models import AbstractUser

from limited.options import PoolSpecificationOption, CubeReleaseOption
from lobbies.games import options as metaoptions
from mtgorp.models.formats.format import Format, LimitedSideboard

from api.models import CubeRelease

from lobbies.exceptions import StartGameException
from lobbies.games.games import Game

# from sealed.models import SealedSession, GenerateSealedPoolException


class Sealed(Game):
    name = 'sealed'

    pool_size = metaoptions.IntegerOption(min = 1, max = 360, default = 90)
    format = metaoptions.OptionsOption(options = Format.formats_map.keys(), default = LimitedSideboard.name)
    open_decks = metaoptions.BooleanOption(default = False)
    pool_specification = PoolSpecificationOption(
        {
            'CubeBoosterSpecification': {
                'release': CubeReleaseOption(),
                'size': metaoptions.IntegerOption(min = 1, max = 360, default = 90),
                'allow_intersection': metaoptions.BooleanOption(default = False),
                'allow_repeat': metaoptions.BooleanOption(default = False),
            }
        },
        default_booster_specification = 'CubeBoosterSpecification',
    )

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        super().__init__(options, players, callback)
        try:
            self._keys = {
                pool.user: str(pool.id)
                for pool in
                SealedSession.generate(
                    release = CubeRelease.objects.get(pk = self._options['release']),
                    users = self._players,
                    pool_size = int(self._options['pool_size']),
                    game_format = Format.formats_map[self._options['format']],
                    open_decks = options['open_decks'],
                    allow_pool_intersection = options['allow_pool_intersection'],
                ).pools.all()
            }
        except GenerateSealedPoolException as e:
            raise StartGameException(e)

    @property
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        return self._keys

    def start(self) -> None:
        self._finished_callback()
