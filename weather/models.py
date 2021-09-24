from django.contrib.postgres.fields import ArrayField
from django.db import models

from utils.mixins import TimestampedModel


class ForecastSliceSnapShot(TimestampedModel, models.Model):
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    average_temperature = models.FloatField()
    total_precipitation = models.FloatField()
    precipitation_types = ArrayField(models.TextField())
