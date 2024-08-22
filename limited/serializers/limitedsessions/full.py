from rest_framework import serializers

from api.serialization import orpserialize
from api.serialization.serializers import OrpSerializerField, UserSerializer
from limited import models
from limited.serializers.limitedsessions.minimal import LimitedSessionNameSerializer
from limited.serializers.pools.minimal import MinimalPoolSerializer
from limited.serializers.poolspecifications import PoolSpecificationSerializer
from tournaments.serializers import TournamentSerializer
from utils.serialization.fields import EnumSerializerField
from utils.values import JAVASCRIPT_DATETIME_FORMAT


class PoolUserField(serializers.RelatedField):
    def to_representation(self, value: models.Pool):
        return UserSerializer(value.user).data

    def to_internal_value(self, data):
        pass


class LimitedSessionSerializer(LimitedSessionNameSerializer):
    created_at = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)
    playing_at = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)
    finished_at = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)
    format = serializers.CharField(read_only=True)
    game_type = serializers.CharField(read_only=True)
    players = PoolUserField(source="pools", read_only=True, many=True)
    state = EnumSerializerField(models.LimitedSession.LimitedSessionState)
    pool_specification = PoolSpecificationSerializer(read_only=True)
    infinites = OrpSerializerField(model_serializer=orpserialize.InfinitesSerializer)

    class Meta:
        model = models.LimitedSession
        fields = (
            "id",
            "name",
            "format",
            "created_at",
            "playing_at",
            "finished_at",
            "players",
            "state",
            "open_decks",
            "open_pools",
            "game_type",
            "pool_specification",
            "infinites",
        )


class FullLimitedSessionSerializer(LimitedSessionSerializer):
    pools = MinimalPoolSerializer(many=True)
    tournament = TournamentSerializer()

    class Meta:
        model = models.LimitedSession
        fields = (
            "id",
            "name",
            "format",
            "created_at",
            "playing_at",
            "finished_at",
            "players",
            "state",
            "open_decks",
            "open_pools",
            "game_type",
            "pool_specification",
            "pools",
            "infinites",
            "tournament",
        )
