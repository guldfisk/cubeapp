from rest_framework import serializers

from api.serialization.serializers import MinimalVersionedCubeSerializer
from league import models
from league.serializers.minimal import MinimalLeagueSerializer
from tournaments.serializers import TournamentSerializer
from utils.serialization.fields import LambdaSerializer


class LeagueSerializer(MinimalLeagueSerializer):
    versioned_cube = MinimalVersionedCubeSerializer()
    tournament_type = LambdaSerializer(lambda tt: tt.name)
    match_type = LambdaSerializer(lambda mt: mt.serialize())

    class Meta:
        model = models.HOFLeague
        fields = (
            'id', 'name', 'versioned_cube', 'previous_n_releases', 'season_size', 'top_n_from_previous_season',
            'low_participation_prioritization_amount', 'tournament_type', 'tournament_config', 'match_type', 'created_at',
        )


class SeasonSerializer(serializers.ModelSerializer):
    league = MinimalLeagueSerializer()
    tournament = TournamentSerializer()

    class Meta:
        model = models.Season
        fields = ('id', 'league', 'tournament', 'created_at')
