from rest_framework import serializers

from api.serialization import orpserialize
from api.serialization.serializers import OrpSerializerField, UserSerializer, NameCubeReleaseSerializer

from utils.values import JAVASCRIPT_DATETIME_FORMAT

from sealed import models


class MinimalPoolSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    created_at = serializers.DateTimeField(
        source = 'session.created_at',
        read_only = True,
        format = JAVASCRIPT_DATETIME_FORMAT,
    )
    pool_size = serializers.IntegerField(source = 'session.pool_size', read_only = True)
    release = NameCubeReleaseSerializer(source = 'session.release', read_only = True)

    class Meta:
        model = models.Pool
        fields = ('key', 'user', 'created_at', 'pool_size', 'release')


class PoolSerializer(MinimalPoolSerializer):
    pool = OrpSerializerField(
        model_serializer = orpserialize.CubeSerializer
    )

    class Meta:
        model = models.Pool
        fields = ('key', 'user', 'created_at', 'pool_size', 'release', 'pool')
