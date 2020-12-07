import typing as t
import uuid

from django.contrib.auth.models import AbstractUser

from lobbies.games.games import Game


class SunKingdomGame(Game):
    name = 'sun kingdoms'

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        super().__init__(options, players, callback)
        self._keys = {player: uuid.uuid4() for player in players}

    @property
    def keys(self) -> t.Mapping[AbstractUser, t.Union[str, int]]:
        return self._keys

    def start(self) -> None:
        self._finished_callback()
