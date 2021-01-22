from rest_framework import serializers

from tournaments.serializers import TournamentSerializer
from league import models


class MinimalSeasonSerializer(serializers.ModelSerializer):
    league = serializers.PrimaryKeyRelatedField(read_only = True)
    tournament = TournamentSerializer()

    class Meta:
        model = models.Season
        fields = ('id', 'league', 'tournament', 'created_at')


class MinimalLeagueSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.HOFLeague
        fields = (
            'id', 'name', 'created_at',
        )
