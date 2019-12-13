from rest_framework import serializers

from api.serialization import orpserialize
from api.serialization.serializers import OrpSerializerField, UserSerializer

from sealed import models


class PoolSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    pool = OrpSerializerField(
        model_serializer = orpserialize.CubeSerializer
    )

    class Meta:
        model = models.Pool
        fields = ('key', 'user', 'pool')
