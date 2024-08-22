from django.contrib.contenttypes.models import ContentType
from magiccube.laps.traps.tree.printingtree import CardboardNodeChild, PrintingNodeChild
from mtgorp.models.interfaces import Cardboard, Printing
from mtgorp.models.serilization.serializeable import compacted_model
from rest_framework import serializers
from rest_framework.fields import SerializerMethodField

from api.models import CubeRelease
from api.serialization import orpserialize
from api.serialization.orpserialize import (
    CardboardCubeableSerializer,
    CubeableSerializer,
)
from api.serialization.serializers import NameCubeReleaseSerializer, OrpSerializerField
from draft.models import DraftSession
from rating import models
from utils.values import JAVASCRIPT_DATETIME_FORMAT


class PrintingNodeChildSerializer(orpserialize.ModelSerializer[PrintingNodeChild]):
    @classmethod
    def serialize(cls, serializeable: PrintingNodeChild) -> compacted_model:
        if isinstance(serializeable, Printing):
            return orpserialize.PrintingSerializer.serialize(serializeable)
        return orpserialize.NodeSerializer.serialize(serializeable)


class CardboardNodeChildSerializer(orpserialize.ModelSerializer[CardboardNodeChild]):
    @classmethod
    def serialize(cls, serializeable: CardboardNodeChild) -> compacted_model:
        if isinstance(serializeable, Cardboard):
            return orpserialize.CardboardSerializer.serialize(serializeable)
        return orpserialize.NodeSerializer.serialize(serializeable)


class NodeRatingComponentSerializer(serializers.ModelSerializer):
    node = OrpSerializerField(model_serializer=CardboardNodeChildSerializer)
    example_node = OrpSerializerField(model_serializer=PrintingNodeChildSerializer)

    class Meta:
        model = models.NodeRatingComponent
        fields = ("id", "node", "node_id", "example_node", "rating_component", "weight")


class CardboardCubeableRatingSerializer(serializers.ModelSerializer):
    cardboard_cubeable = OrpSerializerField(model_serializer=CardboardCubeableSerializer)
    example_cubeable = OrpSerializerField(model_serializer=CubeableSerializer)

    class Meta:
        model = models.CardboardCubeableRating
        fields = ("id", "cardboard_cubeable", "cardboard_cubeable_id", "rating", "example_cubeable")


_CONTENT_TYPE_RATING_MAP = {
    ContentType.objects.get_for_model(CubeRelease).id: "release",
    ContentType.objects.get_for_model(DraftSession).id: "draft",
}


class MinimalRatingMapSerializer(serializers.ModelSerializer):
    release = NameCubeReleaseSerializer()
    created_at = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)
    event_type = SerializerMethodField()

    class Meta:
        model = models.RatingMap
        fields = ("id", "created_at", "release", "event_type")

    @classmethod
    def get_event_type(cls, instance: models.RatingMap) -> str:
        return _CONTENT_TYPE_RATING_MAP[instance.ratings_for_content_type_id]


class DatedCardboardCubeableRatingSerializer(serializers.ModelSerializer):
    rating_map = MinimalRatingMapSerializer()

    class Meta:
        model = models.CardboardCubeableRating
        fields = ("id", "rating", "rating_map")


class DatedNodeRatingComponentSerializer(serializers.ModelSerializer):
    rating_map = MinimalRatingMapSerializer()

    class Meta:
        model = models.NodeRatingComponent
        fields = ("id", "rating_component", "weight", "rating_map")


class RatingMapSerializer(MinimalRatingMapSerializer):
    ratings = CardboardCubeableRatingSerializer(many=True)
    node_rating_components = NodeRatingComponentSerializer(many=True)
    parent = MinimalRatingMapSerializer()
    children = MinimalRatingMapSerializer(many=True)

    class Meta:
        model = models.RatingMap
        fields = (
            "id",
            "release",
            "created_at",
            "ratings",
            "node_rating_components",
            "parent",
            "children",
            "event_type",
        )
