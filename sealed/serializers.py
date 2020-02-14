from rest_framework import serializers

from api.serialization import orpserialize
from api.serialization.serializers import OrpSerializerField, UserSerializer, NameCubeReleaseSerializer
from utils.serialization.fields import EnumSerializerField

from utils.values import JAVASCRIPT_DATETIME_FORMAT

from sealed import models


class PoolUserField(serializers.RelatedField):

    def to_representation(self, value: models.Pool):
        return UserSerializer(value.user).data

    def to_internal_value(self, data):
        pass


class PoolDeckSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    deck = OrpSerializerField(model_serializer = orpserialize.DeckSerializer)

    class Meta:
        model = models.PoolDeck
        fields = ('id', 'name', 'created_at', 'deck')


class MinimalPoolSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    decks = serializers.PrimaryKeyRelatedField(read_only = True, many = True)

    class Meta:
        model = models.Pool
        fields = ('id', 'user', 'decks')


class SealedSessionSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    playing_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    finished_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    pool_size = serializers.IntegerField(read_only = True)
    release = NameCubeReleaseSerializer(read_only = True)
    format = serializers.CharField(read_only = True)
    players = PoolUserField(source = 'pools', read_only = True, many = True)
    state = EnumSerializerField(models.SealedSession.SealedSessionState)

    class Meta:
        model = models.SealedSession
        fields = (
            'id', 'name', 'format', 'release', 'created_at', 'playing_at', 'finished_at', 'pool_size', 'players',
            'state',
        )


class PoolSerializer(MinimalPoolSerializer):
    pool = OrpSerializerField(model_serializer = orpserialize.CubeSerializer)
    decks = PoolDeckSerializer(many = True)
    session = SealedSessionSerializer()

    class Meta:
        model = models.Pool
        fields = ('id', 'user', 'session', 'decks', 'pool')


class FullSealedSessionSerializer(SealedSessionSerializer):
    pools = MinimalPoolSerializer(many = True)

    class Meta:
        model = models.SealedSession
        fields = ('id', 'name', 'format', 'release', 'created_at', 'pool_size', 'players', 'state', 'pools')
