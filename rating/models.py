from django.db import models

from api.fields.orp import CardboardCubeableField
from api.models import CubeRelease
from utils.mixins import TimestampedModel


class RatingMap(TimestampedModel, models.Model):
    release = models.ForeignKey(CubeRelease, on_delete = models.CASCADE, related_name = 'rating_maps')


class CardboardCubeableRating(models.Model):
    rating_map = models.ForeignKey(RatingMap, on_delete = models.CASCADE, related_name = 'ratings')
    cardboard_cubeable_id = models.CharField(max_length = 2047)
    cardboard_cubeable = CardboardCubeableField()
    rating = models.PositiveSmallIntegerField()

    def save(self, force_insert = False, force_update = False, using = None, update_fields = None):
        if not self.cardboard_cubeable_id:
            self.cardboard_cubeable_id = self.cardboard_cubeable.id
        super().save(force_insert, force_update, using, update_fields)

    @property
    def elo(self) -> int:
        self.rating
