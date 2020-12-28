import json
import typing as t
from enum import Enum

from bidict import bidict
from django.db import models


class EnumField(models.Field):

    def __init__(self, enum_type: t.Type[Enum], **kwargs):
        self._enum_type = enum_type
        super().__init__(**kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs['enum_type'] = (
            self._enum_type
            if isinstance(self._enum_type, str) else
            f'{self._enum_type.__module__}.{self._enum_type.__name__}'

        )
        return name, path, args, kwargs

    def db_type(self, connection) -> str:
        return 'INTEGER'

    def from_db_value(self, value, expression, connection) -> Enum:
        if value is None:
            return
        return self._enum_type.__call__(value)

    def get_prep_value(self, value: t.Optional[Enum]) -> t.Optional[int]:
        if value is None:
            return None
        return value.value

    def to_python(self, value) -> Enum:
        return self._enum_type.get(value)


class StringMapField(models.CharField):

    def __init__(self, mapping: t.Mapping[str, t.Any], **kwargs):
        self._mapping = bidict(mapping)
        kwargs.setdefault('max_length', 255)
        super().__init__(**kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs['mapping'] = self._mapping
        return name, path, args, kwargs

    def from_db_value(self, value: str, expression, connection) -> t.Any:
        if value is None:
            return
        return self._mapping[value]

    def get_prep_value(self, value: t.Any) -> t.Optional[str]:
        if value is None:
            return None
        return self._mapping.inverse[value]


class SerializeableField(models.Field):

    def __init__(self, klass: t.Type, **kwargs):
        self._klass = klass
        super().__init__(**kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs['klass'] = (
            self._klass
            if isinstance(self._klass, str) else
            f'{self._klass.__module__}.{self._klass.__name__}'

        )
        return name, path, args, kwargs

    def db_type(self, connection) -> str:
        return 'LONGTEXT'

    def from_db_value(self, value: t.Optional[str], expression, connection) -> t.Any:
        if value is None:
            return
        return self._klass.deserialize(json.loads(value))

    def get_prep_value(self, value: t.Any) -> t.Optional[str]:
        if value is None:
            return None
        return json.dumps(value.serialize())
