from rest_framework import serializers

from api.serialization.serializers import UserSerializer
from limited import models
from utils.values import JAVASCRIPT_DATETIME_FORMAT


class MinimalPoolDeckSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)
    pool_id = serializers.PrimaryKeyRelatedField(source="pool", read_only=True)
    user = UserSerializer(read_only=True, source="pool.user")

    class Meta:
        model = models.PoolDeck
        fields = ("id", "name", "created_at", "pool_id", "user")
