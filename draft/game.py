import random
import typing as t

from django.contrib.auth.models import AbstractUser

from mtgorp.models.collections.cardboardset import CardboardSet
from mtgorp.models.formats.format import Format, LimitedSideboard
from mtgorp.models.serilization.strategies.raw import RawStrategy

from magiccube.collections.infinites import Infinites

from limited.models import PoolSpecification, LimitedSession, Pool, PoolSpecificationOptions
from limited.options import CubeReleaseOption, PoolSpecificationOption, ExpansionOption, CardboardSetOption
from lobbies.games.games import Game
from lobbies.games import options as metaoptions
from draft.coordinator import DRAFT_COORDINATOR
from draft.draft import Draft
from resources.staticdb import db
from tournaments.options import TournamentOptions


class DraftGame(Game):
    name = 'draft'

    format: str = metaoptions.OptionsOption(
        options = Format.formats_map.keys(),
        default = LimitedSideboard.name,
    )
    open_decks: bool = metaoptions.BooleanOption(default = False)
    open_pools: bool = metaoptions.BooleanOption(default = False)
    reverse: bool = metaoptions.BooleanOption(default = False)
    pool_specification: PoolSpecificationOptions = PoolSpecificationOption(
        {
            'CubeBoosterSpecification': {
                'release': CubeReleaseOption(),
                'size': metaoptions.IntegerOption(min = 1, max = 360, default = 7),
                'allow_intersection': metaoptions.BooleanOption(default = False),
                'allow_repeat': metaoptions.BooleanOption(default = False),
                'scale': metaoptions.BooleanOption(default = False),
            },
            'ExpansionBoosterSpecification': {
                'expansion_code': ExpansionOption(),
            },
            'AllCardsBoosterSpecification': {
                'respect_printings': metaoptions.BooleanOption(default = True),
            },
            'ChaosBoosterSpecification': {
                'same': metaoptions.BooleanOption(default = False),
            },
        },
        default_booster_specification = 'CubeBoosterSpecification',
        default_amount = 11,
    )
    draft_format: str = metaoptions.OptionsOption(options = {'single_pick', 'burn'}, default = 'single_pick')
    infinites: t.Mapping[str, t.Any] = CardboardSetOption(
        default = RawStrategy.serialize(
            CardboardSet(
                (
                    db.cardboards[n]
                    for n in
                    (
                        'Plains',
                        'Island',
                        'Swamp',
                        'Mountain',
                        'Forest',
                    )
                )
            )
        )
    )
    allow_cheating = metaoptions.BooleanOption(default = False)
    tournament_options = TournamentOptions()
    use_time_controls = metaoptions.BooleanOption(default = False)
    time_control = metaoptions.FloatOption(default = 0., max = 60 * 60)

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        super().__init__(options, players, callback)
        self._pool_specification = PoolSpecification.from_options(self.pool_specification)

        self._keys = {
            user: drafter.key
            for user, drafter in
            DRAFT_COORDINATOR.start_draft(
                users = random.sample(list(self._players), len(self._players)),
                pool_specification = self._pool_specification,
                infinites = RawStrategy(db).deserialize(Infinites, self.infinites),
                draft_format = self.draft_format,
                reverse = self.reverse,
                finished_callback = self._finished_callback_wrapper,
                time_control = self.time_control if self.use_time_controls else None,
            )
        }

    def _finished_callback_wrapper(self, draft: Draft):
        self._finished_callback()

        tournament_type, tournament_config, match_type = TournamentOptions.deserialize_options(self.tournament_options)

        session = LimitedSession.objects.create(
            game_type = 'draft',
            format = self.format,
            open_decks = self.open_decks,
            open_pools = self.open_pools,
            pool_specification = self._pool_specification,
            infinites = RawStrategy(db).deserialize(Infinites, self.infinites),
            allow_cheating = self.allow_cheating,
            tournament_type = tournament_type,
            tournament_config = tournament_config,
            match_type = match_type,
        )

        draft.draft_session.limited_session = session
        draft.draft_session.save(update_fields = ('limited_session',))

        if self.reverse:
            drafters = list(draft.interfaces.items())
            random.shuffle(drafters)
            for ((drafter, interface), (_, next_interface)) in zip(drafters, drafters[1:] + [drafters[0]]):
                pool = Pool.objects.create(
                    user = drafter.user,
                    session = session,
                    pool = next_interface.pool,
                )
                interface.send_message(
                    'completed',
                    pool_id = pool.id,
                    session_name = session.name,
                )
        else:
            for drafter, interface in draft.interfaces.items():
                pool = Pool.objects.create(
                    user = drafter.user,
                    session = session,
                    pool = interface.pool,
                )
                interface.send_message(
                    'completed',
                    pool_id = pool.id,
                    session_name = session.name,
                )

    @property
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        return self._keys

    def start(self) -> None:
        pass
