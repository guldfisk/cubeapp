from rest_framework import serializers

from kpd import models


class KebabPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.KebabPoint
        fields = ('timestamp', 'value_short', 'value_medium', 'value_long')
