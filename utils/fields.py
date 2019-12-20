import typing as t
from enum import Enum

from django.db import models

from mtgorp.models.serilization.serializeable import Serializeable


class EnumField(models.Field):

    def __init__(self, enum_type: t.Type[Enum], **kwargs):
        self._enum_type = enum_type
        super().__init__(**kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs['enum_type'] = f'{self._enum_type.__module__}.{self._enum_type.__name__}'
        return name, path, args, kwargs

    def db_type(self, connection) -> str:
        return 'INTEGER'

    def from_db_value(self, value, expression, connection) -> Enum:
        if value is None:
            return
        return self._enum_type.get(value)

    def to_python(self, value) -> Enum:
        return self._enum_type.get(value)
