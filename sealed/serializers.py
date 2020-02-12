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
        fields = ('id', 'created_at', 'deck')


class MinimalPoolSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    # created_at = serializers.DateTimeField(
    #     source = 'session.created_at',
    #     read_only = True,
    #     format = JAVASCRIPT_DATETIME_FORMAT,
    # )
    # pool_size = serializers.IntegerField(source = 'session.pool_size', read_only = True)
    # release = NameCubeReleaseSerializer(source = 'session.release', read_only = True)
    # format = serializers.CharField(source = 'session.format', read_only = True)
    # players = PoolUserField(source = 'session.pools', read_only = True, many = True)
    decks = serializers.PrimaryKeyRelatedField(read_only = True, many = True)

    class Meta:
        model = models.Pool
        # fields = ('key', 'format', 'user', 'created_at', 'pool_size', 'release', 'players', 'decks')
        fields = ('key', 'user', 'decks')


class PoolSerializer(MinimalPoolSerializer):
    pool = OrpSerializerField(model_serializer = orpserialize.CubeSerializer)

    class Meta:
        model = models.Pool
        fields = ('key', 'user', 'decks', 'pool')


class SealedSessionSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    pool_size = serializers.IntegerField(read_only = True)
    release = NameCubeReleaseSerializer(read_only = True)
    format = serializers.CharField(read_only = True)
    players = PoolUserField(source = 'pools', read_only = True, many = True)
    state = EnumSerializerField(models.SealedSession.SealedSessionState)

    class Meta:
        model = models.SealedSession
        fields = ('id', 'format', 'release', 'created_at', 'pool_size', 'players', 'state')


class FullSealedSessionSerializer(SealedSessionSerializer):
    pools = MinimalPoolSerializer(many = True)

    class Meta:
        model = models.SealedSession
        fields = ('id', 'format', 'release', 'created_at', 'pool_size', 'players', 'state', 'pools')
