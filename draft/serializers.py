import typing as t

from rest_framework import serializers

from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.serializeable import compacted_model

from magiccube.collections.cubeable import Cubeable
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap

from mtgdraft.models import Pick, SinglePickPick, BurnPick, DraftBooster

from api.serialization.serializers import OrpSerializerField, UserSerializer
from api.serialization import orpserialize

from limited.serializers import PoolSpecificationSerializer, LimitedSessionSerializer

from utils.serialization.fields import EnumSerializerField
from utils.values import JAVASCRIPT_DATETIME_FORMAT

from draft import models


class PickSerializer(orpserialize.ModelSerializer[Pick]):
    _serializer_map: t.Mapping[t.Type[Cubeable], t.Type[orpserialize.ModelSerializer]] = {
        Printing: orpserialize.PrintingSerializer,
        Trap: orpserialize.TrapSerializer,
        Ticket: orpserialize.TicketSerializer,
        Purple: orpserialize.PurpleSerializer,
    }

    @classmethod
    def serialize_cubeable(cls, cubeable: Cubeable) -> compacted_model:
        return cls._serializer_map[cubeable.__class__].serialize(cubeable)

    @classmethod
    def serialize(cls, serializeable: Pick) -> compacted_model:
        return _PICK_SERIALIZER_MAP[serializeable.__class__].serialize(serializeable)


class SinglePickSerializer(PickSerializer):

    @classmethod
    def serialize(cls, serializeable: SinglePickPick) -> compacted_model:
        return {
            'pick': cls.serialize_cubeable(serializeable.cubeable),
            'type': 'single_pick',
        }


class BurnPickSerializer(PickSerializer):

    @classmethod
    def serialize(cls, serializeable: BurnPick) -> compacted_model:
        return {
            'pick': cls.serialize_cubeable(serializeable.pick),
            'burn': cls.serialize_cubeable(serializeable.burn) if serializeable.burn else None,
            'type': 'burn',
        }


class BoosterSerializer(orpserialize.ModelSerializer[DraftBooster]):

    @classmethod
    def serialize(cls, booster: DraftBooster) -> compacted_model:
        return {
            'booster_id': booster.booster_id,
            'pick': booster.pick,
            'cubeables': orpserialize.CubeSerializer.serialize(
                booster.cubeables
            ),
        }


_PICK_SERIALIZER_MAP = {
    SinglePickPick: SinglePickSerializer,
    BurnPick: BurnPickSerializer,
}


class DraftSeatSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)

    class Meta:
        model = models.DraftSeat
        fields = ('id', 'user', 'sequence_number')


class DraftSessionSerializer(serializers.ModelSerializer):
    started_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    ended_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    state = EnumSerializerField(models.DraftSession.DraftState)
    draft_format = serializers.CharField(read_only = True)
    seats = DraftSeatSerializer(read_only = True, many = True)
    infinites = OrpSerializerField(model_serializer = orpserialize.InfinitesSerializer)
    pool_specification = PoolSpecificationSerializer(read_only = True)
    limited_session = LimitedSessionSerializer(read_only = True)

    class Meta:
        model = models.DraftSession
        fields = (
            'id', 'key', 'started_at', 'ended_at', 'state', 'draft_format', 'seats', 'pool_specification',
            'limited_session', 'reverse', 'infinites',
        )


class DraftPickSerializer(serializers.ModelSerializer):
    pick = OrpSerializerField(model_serializer = PickSerializer)
    pack = OrpSerializerField(model_serializer = BoosterSerializer)

    class Meta:
        model = models.DraftPick
        fields = ('id', 'created_at', 'pack_number', 'pick_number', 'pick', 'pack', 'global_pick_number')
