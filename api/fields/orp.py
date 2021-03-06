import typing as t

import json

from django.db import models

from mtgorp.models.serilization.serializeable import Serializeable
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.serilization.strategies.raw import RawStrategy

from magiccube.collections.cubeable import (
    Cubeable, deserialize_cubeable_string, serialize_cubeable_string,
    deserialize_cardboard_cubeable_string, CardboardCubeable, serialize_cardboard_cubeable_string
)

from resources.staticdb import db
from utils.methods import import_path


class OrpField(models.Field):

    def __init__(self, model_type: t.Union[t.Type[Serializeable], str], **kwargs):
        self._model_type: t.Type[Serializeable] = (
            import_path(model_type)
            if isinstance(model_type, str) else
            model_type
        )
        super().__init__(**kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs['model_type'] = f'{self._model_type.__module__}.{self._model_type.__name__}'
        return name, path, args, kwargs

    def db_type(self, connection) -> str:
        return 'LONGTEXT'

    def from_db_value(self, value, expression, connection) -> t.Optional[Serializeable]:
        if value is None:
            return
        return JsonId(db).deserialize(
            self._model_type,
            value,
        )

    def to_python(self, value) -> t.Optional[Serializeable]:
        if isinstance(value, self._model_type):
            return value

        if value is None:
            return

        return JsonId(db).deserialize(
            self._model_type,
            value,
        )

    def get_prep_value(self, value):
        if value is None:
            return None
        if isinstance(value, dict):
            return json.dumps(value)
        return JsonId.serialize(value)

    def get_db_prep_value(self, value, connection, prepared = False):
        return self.get_prep_value(value)


class CubeableField(models.Field):

    def db_type(self, connection) -> str:
        return 'LONGTEXT'

    def from_db_value(self, value, expression, connection) -> t.Optional[Cubeable]:
        if value is None:
            return
        return deserialize_cubeable_string(value, RawStrategy(db))

    def to_python(self, value) -> t.Optional[Cubeable]:
        if value is None:
            return
        return deserialize_cubeable_string(value, RawStrategy(db))

    def get_prep_value(self, value: Cubeable) -> t.Optional[str]:
        if value is None:
            return None
        return serialize_cubeable_string(value)

    def get_db_prep_value(self, value, connection, prepared = False) -> t.Optional[str]:
        return self.get_prep_value(value)


class CardboardCubeableField(models.Field):

    def db_type(self, connection) -> str:
        return 'LONGTEXT'

    def from_db_value(self, value, expression, connection) -> t.Optional[CardboardCubeable]:
        if value is None:
            return
        return deserialize_cardboard_cubeable_string(value, RawStrategy(db))

    def to_python(self, value) -> t.Optional[CardboardCubeable]:
        if value is None:
            return
        return deserialize_cardboard_cubeable_string(value, RawStrategy(db))

    def get_prep_value(self, value: CardboardCubeable) -> t.Optional[str]:
        if value is None:
            return None
        return serialize_cardboard_cubeable_string(value)

    def get_db_prep_value(self, value, connection, prepared = False) -> t.Optional[str]:
        return self.get_prep_value(value)
