from rest_framework import serializers

from league import models


class MinimalLeagueSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.HOFLeague
        fields = (
            'id', 'name', 'created_at',
        )

