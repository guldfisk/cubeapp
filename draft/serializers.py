import typing as t

from rest_framework import serializers

from api.serialization.serializers import OrpSerializerField, UserSerializer

from limited.serializers import PoolSpecificationSerializer, LimitedSessionNameSerializer

from utils.serialization.fields import EnumSerializerField
from utils.values import JAVASCRIPT_DATETIME_FORMAT

from draft import models


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
    pool_specification = PoolSpecificationSerializer(read_only = True)
    limited_session = LimitedSessionNameSerializer(read_only = True)

    class Meta:
        model = models.DraftSession
        fields = (
            'id', 'key', 'started_at', 'ended_at', 'state', 'draft_format', 'seats', 'pool_specification',
            'limited_session',
        )
