import json
import typing as t
from abc import abstractmethod

from django.db import models
from magiccube.collections.cubeable import (
    CardboardCubeable,
    Cubeable,
    deserialize_cardboard_cubeable_string,
    deserialize_cubeable_string,
    serialize_cardboard_cubeable_string,
    serialize_cubeable_string,
)
from magiccube.laps.traps.tree.printingtree import (
    CardboardNode,
    CardboardNodeChild,
    PrintingNode,
    PrintingNodeChild,
)
from mtgorp.models.interfaces import Cardboard, Printing
from mtgorp.models.serilization.serializeable import Serializeable
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.serilization.strategies.raw import RawStrategy

from resources.staticdb import db
from utils.methods import import_path


class OrpField(models.Field):
    def __init__(self, model_type: t.Union[t.Type[Serializeable], str], **kwargs):
        self._model_type: t.Type[Serializeable] = (
            import_path(model_type) if isinstance(model_type, str) else model_type
        )
        super().__init__(**kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs["model_type"] = f"{self._model_type.__module__}.{self._model_type.__name__}"
        return name, path, args, kwargs

    def db_type(self, connection) -> str:
        return "TEXT"

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

    def get_db_prep_value(self, value, connection, prepared=False):
        return self.get_prep_value(value)

    def value_to_string(self, obj):
        return JsonId.serialize(self.value_from_object(obj))


T = t.TypeVar("T")


class TextSerializedField(models.Field, t.Generic[T]):
    @abstractmethod
    def from_native(self, value: str) -> T:
        pass

    @abstractmethod
    def to_native(self, value: T) -> str:
        pass

    def db_type(self, connection) -> str:
        return "TEXT"

    def from_db_value(self, value, expression, connection) -> t.Optional[T]:
        if value is None:
            return
        return self.from_native(value)

    def to_python(self, value) -> t.Optional[Cubeable]:
        if value is None:
            return
        return self.from_native(value)

    def get_prep_value(self, value: Cubeable) -> t.Optional[str]:
        if value is None:
            return None
        return self.to_native(value)


class CardboardField(TextSerializedField[Cardboard]):
    def from_native(self, value: str) -> Cardboard:
        return db.cardboards[value]

    def to_native(self, value: Cardboard) -> str:
        return value.name


class CubeableField(TextSerializedField[Cubeable]):
    def from_native(self, value: str) -> Cubeable:
        return deserialize_cubeable_string(value, RawStrategy(db))

    def to_native(self, value: Cubeable) -> str:
        return serialize_cubeable_string(value)


class PrintingNodeChildField(TextSerializedField[PrintingNodeChild]):
    def from_native(self, value: str) -> T:
        if value[0] == "{":
            return JsonId(db).deserialize(PrintingNode, value)
        return db.printings[int(value)]

    def to_native(self, value: T) -> str:
        if isinstance(value, Printing):
            return str(value.id)
        return JsonId.serialize(value)


class CardboardCubeableField(TextSerializedField[CardboardCubeable]):
    def from_native(self, value: str) -> T:
        return deserialize_cardboard_cubeable_string(value, RawStrategy(db))

    def to_native(self, value: T) -> str:
        return serialize_cardboard_cubeable_string(value)


class CardboardNodeChildField(TextSerializedField[CardboardNodeChild]):
    def from_native(self, value: str) -> T:
        if value[0] == "{":
            return JsonId(db).deserialize(CardboardNode, value)
        return db.cardboards[value]

    def to_native(self, value: T) -> str:
        if isinstance(value, Cardboard):
            return value.name
        return JsonId.serialize(value)
