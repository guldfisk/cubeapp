from rest_framework import serializers

from api.serialization import orpserialize
from api.serialization.serializers import OrpSerializerField, UserSerializer, NameCubeReleaseSerializer

from sealed import models


class PoolSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    pool = OrpSerializerField(
        model_serializer = orpserialize.CubeSerializer
    )

    class Meta:
        model = models.Pool
        fields = ('key', 'user', 'pool')


class MinimalPoolSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    created_at = serializers.DateTimeField(source = 'session.created_at', read_only = True)
    pool_size = serializers.IntegerField(source = 'session.pool_size', read_only = True)
    release = NameCubeReleaseSerializer(source = 'session.release', read_only = True)

    class Meta:
        model = models.Pool
        fields = ('key', 'user', 'created_at', 'pool_size', 'release')
