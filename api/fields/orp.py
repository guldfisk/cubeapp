import typing as t

from django.db import models

from mtgorp.models.serilization.serializeable import Serializeable
from mtgorp.models.serilization.strategies.jsonid import JsonId

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
        return JsonId.serialize(value)

    def get_db_prep_value(self, value, connection, prepared=False):
        return self.get_prep_value(value)