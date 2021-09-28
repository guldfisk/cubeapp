from django.db import models

from utils.mixins import TimestampedModel


class SessionKey(TimestampedModel, models.Model):
    key = models.CharField(max_length = 255)
    valid_until = models.DateTimeField()
    expiration_notified = models.BooleanField(default = False)


class RangeRequest(TimestampedModel, models.Model):
    requested_from = models.DateField()
    requested_to = models.DateField()


class KebabEvent(models.Model):
    timestamp = models.DateTimeField(unique = True)


class LogPoint(models.Model):
    timestamp = models.DateTimeField()
    type = models.CharField(max_length = 31)
    value_short = models.FloatField()
    value_medium = models.FloatField()
    value_long = models.FloatField()

    class Meta:
        unique_together = ('timestamp', 'type')
