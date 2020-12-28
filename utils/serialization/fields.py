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


class LambdaSerializer(serializers.Field):

    def __init__(
        self,
        serializer: t.Callable[[t.Any], t.Any],
        *args,
        **kwargs,
    ):
        kwargs['read_only'] = True
        super().__init__(*args, **kwargs)
        self._serializer = serializer

    def to_internal_value(self, data):
        raise NotImplemented()

    def to_representation(self, value: t.Any) -> t.Any:
        return self._serializer(value)
