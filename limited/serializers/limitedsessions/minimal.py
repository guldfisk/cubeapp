from rest_framework import serializers

from limited import models


class LimitedSessionNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LimitedSession
        fields = (
            'id', 'name',
        )
