import typing as t
from distutils.util import strtobool

from django.contrib.auth.models import AbstractUser

from mtgorp.models.formats.format import Format

from api.models import CubeRelease

from lobbies.exceptions import StartGameException
from lobbies.games.games import Game, OptionsValidationError

from sealed.models import SealedSession, GenerateSealedPoolException


class Sealed(Game):
    name = 'sealed'

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

    @classmethod
    def get_default_options(cls) -> t.Mapping[str, t.Any]:
        return {
            'pool_size': 90,
            'format': 'limited_sideboard',
            'release': CubeRelease.objects.filter(
                versioned_cube_id = 1,
            ).order_by(
                'created_at',
            ).values_list('id', flat = True).last(),
            'open_decks': False,
            'allow_pool_intersection': False,
        }

    @classmethod
    def validate_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        validated = {}

        if 'pool_size' in options:
            try:
                validated['pool_size'] = int(options['pool_size'])
            except ValueError:
                raise OptionsValidationError(f"Invalid pool size \"{options['pool_size']}\"")

        _format = options.get('format')
        if _format:
            if _format not in Format.formats_map:
                raise OptionsValidationError(f'Invalid format "{_format}"')
            validated['format'] = _format

        _release = options.get('release')
        if _release:
            try:
                _release = int(_release)
            except ValueError:
                raise OptionsValidationError(f'Invalid release "{_release}"')
            if not CubeRelease.objects.filter(pk = _release).exists():
                raise OptionsValidationError(f'Invalid release "{_release}"')
            validated['release'] = _release

        _open_decks = options.get('open_decks')
        if _open_decks is not None:
            try:
                _open_decks = strtobool(str(_open_decks))
            except ValueError:
                raise OptionsValidationError(f'Invalid value for "open_decks": "{_open_decks}"')
            validated['open_decks'] = _open_decks

        _allow_intersection = options.get('allow_pool_intersection')
        if _allow_intersection is not None:
            try:
                _allow_intersection = strtobool(str(_allow_intersection))
            except ValueError:
                raise OptionsValidationError(f'Invalid value for "allow_pool_intersection": "{_allow_intersection}"')
            validated['allow_pool_intersection'] = _allow_intersection

        return validated

    def start(self) -> None:
        self._finished_callback()
