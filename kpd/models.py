from django.db import models

from utils.mixins import TimestampedModel


class RangeRequest(TimestampedModel, models.Model):
    requested_from = models.DateField()
    requested_to = models.DateField()


class KebabEvent(models.Model):
    timestamp = models.DateTimeField()


class KebabPoint(models.Model):
    timestamp = models.DateTimeField()
    value_short = models.FloatField()
    value_medium = models.FloatField()
    value_long = models.FloatField()
