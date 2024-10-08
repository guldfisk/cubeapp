import itertools
import typing as t

from django.contrib.auth.models import AbstractUser
from django.db import transaction
from magiccube.collections.infinites import Infinites
from mtgorp.models.collections.cardboardset import CardboardSet
from mtgorp.models.formats.format import Format, LimitedSideboard
from mtgorp.models.limited.boostergen import GenerateBoosterException
from mtgorp.models.serilization.strategies.raw import RawStrategy

from limited.models import (
    LimitedSession,
    Pool,
    PoolSpecification,
    PoolSpecificationOptions,
)
from limited.options import (
    CardboardSetOption,
    CubeReleaseOption,
    ExpansionOption,
    PoolSpecificationOption,
)
from lobbies.exceptions import StartGameException
from lobbies.games import options as metaoptions
from lobbies.games.games import Game
from resources.staticdb import db
from tournaments.options import TournamentOptions


class Sealed(Game):
    name = "sealed"

    format: str = metaoptions.OptionsOption(options=Format.formats_map.keys(), default=LimitedSideboard.name)
    open_decks: bool = metaoptions.BooleanOption(default=False)
    open_pools: bool = metaoptions.BooleanOption(default=False)
    pool_specification: PoolSpecificationOptions = PoolSpecificationOption(
        {
            "CubeBoosterSpecification": {
                "release": CubeReleaseOption(),
                "size": metaoptions.IntegerOption(min=1, max=360, default=90),
                "allow_intersection": metaoptions.BooleanOption(default=False),
                "allow_repeat": metaoptions.BooleanOption(default=False),
                "scale": metaoptions.BooleanOption(default=False),
            },
            "ExpansionBoosterSpecification": {
                "expansion_code": ExpansionOption(),
            },
            "AllCardsBoosterSpecification": {
                "respect_printings": metaoptions.BooleanOption(default=True),
            },
            "ChaosBoosterSpecification": {
                "same": metaoptions.BooleanOption(default=False),
            },
        },
        default_booster_specification="CubeBoosterSpecification",
    )
    infinites: t.Mapping[str, t.Any] = CardboardSetOption(
        default=RawStrategy.serialize(
            CardboardSet(
                (
                    db.cardboards[n]
                    for n in (
                        "Plains",
                        "Island",
                        "Swamp",
                        "Mountain",
                        "Forest",
                    )
                )
            )
        )
    )
    mirrored = metaoptions.BooleanOption(default=False)
    tournament_options = TournamentOptions()

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        super().__init__(options, players, callback)

        tournament_type, tournament_config, match_type = TournamentOptions.deserialize_options(self.tournament_options)

        with transaction.atomic():
            pool_specification = PoolSpecification.from_options(self.pool_specification)
            session = LimitedSession.objects.create(
                game_type="sealed",
                format=self.format,
                open_decks=self.open_decks,
                open_pools=self.open_pools,
                pool_specification=pool_specification,
                infinites=RawStrategy(db).deserialize(Infinites, self.infinites),
                tournament_type=tournament_type,
                tournament_config=tournament_config,
                match_type=match_type,
            )

            self._keys = {}

            try:
                for player, pool in zip(
                    players,
                    itertools.repeat(pool_specification.get_pool())
                    if self.mirrored
                    else pool_specification.get_pools(len(players)),
                ):
                    self._keys[player] = Pool.objects.create(
                        user=player,
                        session=session,
                        pool=pool,
                    ).id
            except GenerateBoosterException as e:
                self._keys = {}
                raise StartGameException(str(e))

    @property
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        return self._keys

    def start(self) -> None:
        self._finished_callback()
