from rest_framework import serializers

from api.serialization.serializers import MinimalVersionedCubeSerializer
from league import models
from utils.serialization.fields import LambdaSerializer


class LeagueSerializer(serializers.ModelSerializer):
    versioned_cube = MinimalVersionedCubeSerializer()
    tournament_type = LambdaSerializer(lambda tt: tt.name)
    match_type = LambdaSerializer(lambda mt: mt.serialize())

    class Meta:
        model = models.HOFLeague
        fields = (
            'id', 'name', 'versioned_cube', 'previous_n_releases', 'season_size', 'top_n_from_previous_season',
            'low_participation_prioritization_amount', 'tournament_type', 'tournament_config', 'match_type',
        )

    # name = models.CharField(max_length = 255)
    # versioned_cube = models.ForeignKey(VersionedCube, on_delete = models.CASCADE, related_name = 'leagues')
    # previous_n_releases = models.PositiveSmallIntegerField()
    # # min_season_delay = TimeDeltaField()
    # season_size = models.PositiveSmallIntegerField()
    # top_n_from_previous_season = models.PositiveSmallIntegerField()
    # low_participation_prioritization_amount = models.PositiveSmallIntegerField()
    # tournament_type: t.Type[to.Tournament] = StringMapField(to.Tournament.tournaments_map)
    # tournament_config = models.JSONField()
    # match_type: MatchType = SerializeableField(MatchType)

class SeasonSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Season
        fields = ('id', 'league', '')