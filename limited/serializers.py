import typing as t

from rest_framework import serializers
from rest_framework.fields import empty

from api.serialization import orpserialize
from api.serialization.serializers import OrpSerializerField, UserSerializer
from utils.serialization.fields import EnumSerializerField

from utils.values import JAVASCRIPT_DATETIME_FORMAT

from limited import models


class BoosterSpecificationSerializer(serializers.Serializer):

    def run_validation(self, data: t.Union[t.Type[empty], t.Dict[str, t.Any]] = empty):
        pass

    def save(self, **kwargs):
        raise NotImplemented()

    def update(self, instance, validated_data):
        raise NotImplemented()

    def create(self, validated_data):
        raise NotImplemented()

    def to_representation(self, instance: models.BoosterSpecification):
        return instance.serialize()


class PoolSpecificationSerializer(serializers.ModelSerializer):
    specifications = BoosterSpecificationSerializer(many = True, read_only = True)

    class Meta:
        model = models.PoolSpecification
        fields = ('id', 'specifications')


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


class MatchPlayerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    user_id = serializers.IntegerField(write_only = True)

    class Meta:
        model = models.MatchPlayer
        fields = ('id', 'user', 'wins', 'user_id')


class MatchResultSerializer(serializers.ModelSerializer):
    players = MatchPlayerSerializer(many = True)

    class Meta:
        model = models.MatchResult
        fields = ('id', 'players', 'draws')


class LimitedSessionNameSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.LimitedSession
        fields = (
            'id', 'name',
        )


class LimitedSessionSerializer(LimitedSessionNameSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    playing_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    finished_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    format = serializers.CharField(read_only = True)
    game_type = serializers.CharField(read_only = True)
    players = PoolUserField(source = 'pools', read_only = True, many = True)
    state = EnumSerializerField(models.LimitedSession.LimitedSessionState)
    pool_specification = PoolSpecificationSerializer(read_only = True)
    results = MatchResultSerializer(many = True, read_only = True)

    class Meta:
        model = models.LimitedSession
        fields = (
            'id', 'name', 'format', 'created_at', 'playing_at', 'finished_at', 'players', 'state', 'open_decks',
            'game_type', 'pool_specification', 'results'
        )


class PoolSerializer(MinimalPoolSerializer):
    pool = OrpSerializerField(model_serializer = orpserialize.CubeSerializer)
    decks = PoolDeckSerializer(many = True)
    session = LimitedSessionSerializer()

    class Meta:
        model = models.Pool
        fields = ('id', 'user', 'session', 'decks', 'pool')


class FullLimitedSessionSerializer(LimitedSessionSerializer):
    pools = MinimalPoolSerializer(many = True)

    class Meta:
        model = models.LimitedSession
        fields = (
            'id', 'name', 'format', 'created_at', 'playing_at', 'finished_at', 'players', 'state', 'open_decks',
            'game_type', 'pool_specification', 'pools', 'results',
        )
