import random
import typing as t

from django.contrib.auth.models import AbstractUser

from draft.draft import Draft
from mtgorp.models.formats.format import Format, LimitedSideboard

from limited.models import PoolSpecification, LimitedSession, Pool
from limited.options import CubeReleaseOption, PoolSpecificationOption

from lobbies.games.games import Game
from lobbies.games import options as metaoptions

from draft.coordinator import DRAFT_COORDINATOR


class DraftGame(Game):
    name = 'draft'

    format = metaoptions.OptionsOption(options = Format.formats_map.keys(), default = LimitedSideboard.name)
    open_decks = metaoptions.BooleanOption(default = False)
    pool_specification = PoolSpecificationOption(
        {
            'CubeBoosterSpecification': {
                'release': CubeReleaseOption(),
                'size': metaoptions.IntegerOption(min = 1, max = 360, default = 7),
                'allow_intersection': metaoptions.BooleanOption(default = False),
                'allow_repeat': metaoptions.BooleanOption(default = False),
            }
        },
        default_booster_specification = 'CubeBoosterSpecification',
        default_amount = 11,
    )
    draft_format = metaoptions.OptionsOption(options = {'single_pick', 'burn'}, default = 'single_pick')

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        super().__init__(options, players, callback)
        self._pool_specification = PoolSpecification.from_options(self._options['pool_specification'])
        self._open_decks = self._options['open_decks']
        self._game_format = self._options['format']

        self._keys = {
            user: drafter.key
            for user, drafter in
            DRAFT_COORDINATOR.start_draft(
                users = random.sample(list(self._players), len(self._players)),
                pool_specification = self._pool_specification,
                draft_format = options['draft_format'],
                finished_callback = self._finished_callback_wrapper,
            )
        }

    def _finished_callback_wrapper(self, draft: Draft):
        self._finished_callback()
        session = LimitedSession.objects.create(
            game_type = 'draft',
            format = self._game_format,
            open_decks = self._open_decks,
            pool_specification = self._pool_specification,
        )

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
