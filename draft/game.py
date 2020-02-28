import random
import typing as t

from django.contrib.auth.models import AbstractUser

from api.models import CubeRelease
from mtgorp.models.formats.format import Format, LimitedSideboard

from lobbies.games.games import Game
from lobbies.games import options as metaoptions

from draft.coordinator import DRAFT_COORDINATOR


class Draft(Game):
    name = 'draft'

    pack_size = metaoptions.IntegerOption(min = 1, max = 64, default = 11)
    pack_amount = metaoptions.IntegerOption(min = 1, max = 32, default = 7)
    format = metaoptions.OptionsOption(options = Format.formats_map.keys(), default = LimitedSideboard.name)
    draft_format = metaoptions.OptionsOption(options = {'single_pick', 'burn'}, default = 'single_pick')
    release = metaoptions.CubeReleaseOption()

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        super().__init__(options, players, callback)
        self._keys = {
            user: drafter.key
            for user, drafter in
            DRAFT_COORDINATOR.start_draft(
                users = random.sample(list(self._players), len(self._players)),
                release = CubeRelease.objects.get(pk = options['release']),
                pack_amount = options['pack_amount'],
                pack_size = options['pack_size'],
                draft_format = options['draft_format'],
            )
        }

    @property
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        return self._keys

    def start(self) -> None:
        pass
