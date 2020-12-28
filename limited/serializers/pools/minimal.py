from rest_framework import serializers

from api.serialization.serializers import UserSerializer
from limited import models


class MinimalPoolSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only = True)
    decks = serializers.PrimaryKeyRelatedField(read_only = True, source = 'pool_decks', many = True)

    class Meta:
        model = models.Pool
        fields = ('id', 'user', 'decks')
