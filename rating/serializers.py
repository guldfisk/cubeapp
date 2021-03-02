import typing as t

from rest_framework import serializers

from mtgorp.models.interfaces import Cardboard, Printing
from mtgorp.models.serilization.serializeable import compacted_model

from magiccube.collections.cubeable import CardboardCubeable, Cubeable
from magiccube.laps.purples.purple import CardboardPurple, Purple
from magiccube.laps.tickets.ticket import CardboardTicket, Ticket
from magiccube.laps.traps.trap import CardboardTrap, Trap

from api.serialization import orpserialize
from api.serialization.serializers import NameCubeReleaseSerializer, OrpSerializerField
from rating import models
from utils.values import JAVASCRIPT_DATETIME_FORMAT


class CubeableSerializer(orpserialize.ModelSerializer[Cubeable]):
    _serializer_map: t.Mapping[t.Type[Cubeable], t.Type[orpserialize.ModelSerializer]] = {
        Printing.__name__: orpserialize.PrintingSerializer,
        Trap.__name__: orpserialize.TrapSerializer,
        Ticket.__name__: orpserialize.TicketSerializer,
        Purple.__name__: orpserialize.PurpleSerializer,
    }

    @classmethod
    def serialize(cls, serializeable: Cubeable) -> compacted_model:
        return cls._serializer_map[serializeable.__class__.__name__].serialize(serializeable)


class CardboardCubeableSerializer(orpserialize.ModelSerializer[CardboardCubeable]):
    _serializer_map: t.Mapping[t.Type[CardboardCubeable], t.Type[orpserialize.ModelSerializer]] = {
        Cardboard.__name__: orpserialize.CardboardSerializer,
        CardboardTrap.__name__: orpserialize.TrapSerializer,
        CardboardTicket.__name__: orpserialize.TicketSerializer,
        CardboardPurple.__name__: orpserialize.PurpleSerializer,
    }

    @classmethod
    def serialize(cls, serializeable: CardboardCubeable) -> compacted_model:
        return cls._serializer_map[serializeable.__class__.__name__].serialize(serializeable)


class CardboardCubeableRatingSerializer(serializers.ModelSerializer):
    cardboard_cubeable = OrpSerializerField(model_serializer = CardboardCubeableSerializer)
    example_cubeable = OrpSerializerField(model_serializer = CubeableSerializer)

    class Meta:
        model = models.CardboardCubeableRating
        fields = ('id', 'cardboard_cubeable', 'cardboard_cubeable_id', 'rating', 'example_cubeable')


class DatedCardboardCubeableRatingSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)

    class Meta:
        model = models.CardboardCubeableRating
        fields = ('id', 'rating', 'created_at')


class RatingMapSerializer(serializers.ModelSerializer):
    release = NameCubeReleaseSerializer()
    ratings = CardboardCubeableRatingSerializer(many = True)
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)

    class Meta:
        model = models.RatingMap
        fields = ('id', 'release', 'created_at', 'ratings')
