import typing as t

from enum import Enum

from rest_framework import serializers


class EnumSerializerField(serializers.Field):

    def __init__(
        self,
        enum: t.Type[Enum],
        *args,
        **kwargs,
    ):
        kwargs['read_only'] = True
        super().__init__(*args, **kwargs)
        self._enum = enum

    def to_internal_value(self, data):
        return data.name

    def to_representation(self, value):
        return value.name
