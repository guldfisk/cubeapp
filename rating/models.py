from django.db import models

from api.fields.orp import CubeableField
from api.models import CubeRelease
from utils.mixins import TimestampedModel


class RatingMap(TimestampedModel, models.Model):
    release = models.ForeignKey(CubeRelease, on_delete = models.CASCADE, related_name = 'rating_maps')


class CubeableRating(models.Model):
    rating_map = models.ForeignKey(RatingMap, on_delete = models.CASCADE, related_name = 'ratings')
    cubeable_id = models.CharField(max_length = 511)
    cubeable = CubeableField()
    rating = models.PositiveSmallIntegerField()

    def save(self, force_insert = False, force_update = False, using = None, update_fields = None):
        if not self.cubeable_id:
            self.cubeable_id = self.cubeable.id
        super().save(force_insert, force_update, using, update_fields)
