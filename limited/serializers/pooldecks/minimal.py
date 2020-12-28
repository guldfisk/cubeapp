from rest_framework import serializers

from limited import models
from utils.values import JAVASCRIPT_DATETIME_FORMAT


class MinimalPoolDeckSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    pool_id = serializers.PrimaryKeyRelatedField(source = 'pool', read_only = True)

    class Meta:
        model = models.PoolDeck
        fields = ('id', 'name', 'created_at', 'pool_id')
