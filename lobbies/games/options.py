import typing as t

from abc import ABC, abstractmethod
from distutils.util import strtobool

from api.models import CubeRelease
from mtgorp.models.formats.format import LimitedSideboard


class OptionsValidationError(Exception):
    pass


class Option(ABC):
    _name: str

    def __init__(self, **kwargs):
        self._name = kwargs.get('name')
        self._default_value = kwargs.get('default')

    @property
    def default(self) -> t.Any:
        return self._default_value

    @abstractmethod
    def validate(self, value: t.Any) -> t.Any:
        pass


class IntegerOption(Option):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._default_value = kwargs.get('default', 1)
        self._min = kwargs.get('min', 1)
        self._max = kwargs.get('max', 127)

    def validate(self, value: t.Any) -> t.Any:
        try:
            _value = int(value)
        except ValueError:
            raise OptionsValidationError('invalid value "{}" for {}'.format(value, self._name))
        if _value not in range(self._min, self._max):
            raise OptionsValidationError(
                'invalid value "{}" for {}: not in allowed range({} - {})'.format(
                    _value,
                    self._name,
                    self._min,
                    self._max,
                )
            )
        return _value


class OptionsOption(Option):

    def __init__(self, options: t.AbstractSet[str], **kwargs):
        super().__init__(**kwargs)
        self._options = options

    def validate(self, value: t.Any) -> t.Any:
        if value not in self._options:
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        return value


class BooleanOption(Option):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._default_value = kwargs.get('default', True)

    def validate(self, value: t.Any) -> t.Any:
        try:
            _value = strtobool(str(value))
        except ValueError:
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        return _value


class CubeReleaseOption(Option):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @property
    def default(self) -> t.Any:
        return CubeRelease.objects.order_by(
            'created_at',
        ).values_list('id', flat = True).last()

    def validate(self, value: t.Any) -> t.Any:
        try:
            _release = int(value)
        except ValueError:
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        if not CubeRelease.objects.filter(pk = _release).exists():
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        return _release


# class FormatOption(Option):
#
#     def __init__(self, **kwargs):
#         super().__init__(**kwargs)
#         self._default_value = kwargs.get('default', LimitedSideboard)
#
#     @property
#     def default(self) -> t.Any:
#         return self._default_value.name
#
#     def validate(self, value: t.Any) -> t.Any:
#         if value not in Format.formats_map:
#             raise OptionsValidationError(f'Invalid format "{value}"')
#         validated['format'] = value


# class _OptionsMeta(type):
#
#     def __new__(mcs, classname, base_classes, attributes):
#         klass = type.__new__(mcs, classname, base_classes, attributes)
#
#         if 'name' in attributes:
#             mcs.games_map[attributes['name']] = klass
#
#         return klass
#
#
# class Options(AB)
