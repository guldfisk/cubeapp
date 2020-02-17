import typing as t

from django.contrib.auth.models import AbstractUser

from lobbies.games.games import Game, OptionsValidationError
from sealed.formats import Format


class Sealed(Game):

    @classmethod
    def validate_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        pool_size = options.get('pool_size', 90)
        try:
            pool_size = int(pool_size)
        except ValueError:
            raise OptionsValidationError(f'Invalid pool size "{pool_size}"')

        if not pool_size > 0:
            raise OptionsValidationError('Invalid pool size must be great than 0')

        _format = options.get('format', 'limited_sideboard')

        if _format not in Format.formats_map:
            raise OptionsValidationError(f'Invalid format "{_format}"')

        return {
            'pool_size': pool_size,
            'format': _format,
        }

    def start(
        self,
        options: t.Mapping[str, t.Any],
        players: t.AbstractSet[AbstractUser],
    ) -> t.Mapping[AbstractUser, t.Mapping[str, t.Any]]:
        pass
