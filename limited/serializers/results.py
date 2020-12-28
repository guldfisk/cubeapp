from rest_framework import serializers

from api.serialization.serializers import UserSerializer
from limited import models


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
