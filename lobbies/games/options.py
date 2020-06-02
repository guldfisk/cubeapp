from __future__ import annotations

import typing as t

from abc import abstractmethod, ABCMeta
from distutils.util import strtobool


T = t.TypeVar('T')


class OptionsValidationError(Exception):
    pass


class Option(t.Generic[T]):
    _name: str

    def __init__(self, **kwargs):
        self._name = kwargs.get('name')
        self._default_value = kwargs.get('default')

    def __get__(self, instance: Optioned, owner: t.Type[Optioned]) -> T:
        return instance._options[self._name]

    def __set__(self, instance: Optioned, value: t.Any) -> None:
        instance._options[self._name] = self.validate(value)

    @property
    def default(self) -> T:
        return self._default_value

    @abstractmethod
    def validate(self, value: t.Any) -> T:
        pass


class IntegerOption(Option[int]):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._default_value = kwargs.get('default', 1)
        self._min = kwargs.get('min', 1)
        self._max = kwargs.get('max', 127)

    def validate(self, value: t.Any) -> int:
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


class OptionsOption(Option[T]):

    def __init__(self, options: t.AbstractSet[str], **kwargs):
        super().__init__(**kwargs)
        self._options = options

    def validate(self, value: t.Any) -> T:
        if value not in self._options:
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        return value


class BooleanOption(Option[bool]):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._default_value = kwargs.get('default', True)

    def validate(self, value: t.Any) -> bool:
        try:
            _value = strtobool(str(value))
        except ValueError:
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        return _value


class _OptionedMeta(ABCMeta):
    optioneds_map: t.MutableMapping[str, t.Type[Optioned]] = {}
    options_meta: t.Mapping[str, Option]

    def __new__(mcs, classname, base_classes, attributes):
        options = {}

        for key, attribute in attributes.items():
            if isinstance(attribute, Option):
                if attribute._name is None:
                    attribute._name = key
                options[attribute._name] = attribute

        attributes['options_meta'] = options

        klass = type.__new__(mcs, classname, base_classes, attributes)

        if 'name' in attributes:
            mcs.optioneds_map[attributes['name']] = klass

        return klass


class Optioned(object, metaclass = _OptionedMeta):

    def __init__(self, options: t.Optional[t.Mapping[str, t.Any]] = None):
        self._options: t.MutableMapping[str, t.Any] = self.get_default_options()
        if options:
            self.update_options(options)

    @classmethod
    def get_default_options(cls) -> t.MutableMapping[str, t.Any]:
        return {
            name: value.default
            for name, value in
            cls.options_meta.items()
        }

    @classmethod
    def validate_options(cls, options: t.Mapping[str, t.Any], silent: bool = False) -> t.Mapping[str, t.Any]:
        if silent:
            validated = {}
            for option, value in options.items():
                if option not in cls.options_meta:
                    continue
                try:
                    validated[option] = cls.options_meta[option].validate(value)
                except OptionsValidationError:
                    pass
            return validated

        return {
            option: cls.options_meta[option].validate(value)
            for option, value in
            options.items()
            if option in cls.options_meta
        }

    def update_options(self, options: t.Mapping[str, t.Any], silent: bool = False) -> None:
        self._options.update(self.validate_options(options, silent = silent))
