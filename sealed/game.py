import typing as t

from django.contrib.auth.models import AbstractUser

from api.models import CubeRelease

from lobbies.exceptions import StartGameException
from lobbies.games.games import Game, OptionsValidationError

from sealed.formats import Format
from sealed.models import SealedSession, GenerateSealedPoolException


class Sealed(Game):
    name = 'sealed'

    def __init__(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
        callback: t.Callable[[], None],
    ):
        print('sealed init')
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
                ).pools.all()
            }
        except GenerateSealedPoolException as e:
            raise StartGameException(e)
        print('sealed init done')

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

        return validated

    def start(self) -> None:
        self._finished_callback()