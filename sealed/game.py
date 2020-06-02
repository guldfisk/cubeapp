import typing as t

from django.contrib.auth.models import AbstractUser
from django.db import transaction

from mtgorp.models.limited.boostergen import GenerateBoosterException
from mtgorp.models.formats.format import Format, LimitedSideboard

from limited.models import PoolSpecification, LimitedSession, Pool, PoolSpecificationOptions
from limited.options import PoolSpecificationOption, CubeReleaseOption, ExpansionOption
from lobbies.games import options as metaoptions
from lobbies.exceptions import StartGameException
from lobbies.games.games import Game


class Sealed(Game):
    name = 'sealed'

    format: str = metaoptions.OptionsOption(options = Format.formats_map.keys(), default = LimitedSideboard.name)
    open_decks: bool = metaoptions.BooleanOption(default = False)
    open_pools: bool = metaoptions.BooleanOption(default = False)
    pool_specification: PoolSpecificationOptions = PoolSpecificationOption(
        {
            'CubeBoosterSpecification': {
                'release': CubeReleaseOption(),
                'size': metaoptions.IntegerOption(min = 1, max = 360, default = 90),
                'allow_intersection': metaoptions.BooleanOption(default = False),
                'allow_repeat': metaoptions.BooleanOption(default = False),
            },
            'ExpansionBoosterSpecification': {
                'expansion_code': ExpansionOption(),
            },
            'AllCardsBoosterSpecification': {
                'respect_printings': metaoptions.BooleanOption(default = True),
            },
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
        with transaction.atomic():
            pool_specification = PoolSpecification.from_options(self.pool_specification)
            session = LimitedSession.objects.create(
                game_type = 'sealed',
                format = self.format,
                open_decks = self.open_decks,
                open_pools = self.open_pools,
                pool_specification = pool_specification,
            )

            self._keys = {}

            try:
                for player, pool in zip(players, pool_specification.get_pools(len(players))):
                    self._keys[player] = Pool.objects.create(
                        user = player,
                        session = session,
                        pool = pool,
                    ).id
            except GenerateBoosterException as e:
                self._keys = {}
                raise StartGameException(str(e))

    @property
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        return self._keys

    def start(self) -> None:
        self._finished_callback()
