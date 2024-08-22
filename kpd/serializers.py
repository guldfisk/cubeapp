from rest_framework import serializers

from kpd import models


class LogPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LogPoint
        fields = ("timestamp", "value_short", "value_medium", "value_long")
