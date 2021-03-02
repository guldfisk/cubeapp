from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from api.fields.orp import CardboardCubeableField, CubeableField
from api.models import CubeRelease
from utils.mixins import TimestampedModel


class RatingMap(TimestampedModel, models.Model):
    release = models.ForeignKey(CubeRelease, on_delete = models.CASCADE, related_name = 'rating_maps')
    ratings_for_content_type = models.ForeignKey(ContentType, on_delete = models.CASCADE)
    ratings_for_object_id = models.PositiveIntegerField()
    ratings_for = GenericForeignKey('ratings_for_content_type', 'ratings_for_object_id', )

    class Meta:
        unique_together = ('ratings_for_content_type', 'ratings_for_object_id')


class CardboardCubeableRating(models.Model):
    rating_map = models.ForeignKey(RatingMap, on_delete = models.CASCADE, related_name = 'ratings')
    cardboard_cubeable_id = models.CharField(max_length = 2047)
    cardboard_cubeable = CardboardCubeableField()
    example_cubeable = CubeableField()
    rating = models.PositiveSmallIntegerField()

    class Meta:
        unique_together = ('cardboard_cubeable_id', 'rating_map')
        ordering = ('-rating',)

    def save(self, force_insert = False, force_update = False, using = None, update_fields = None):
        if not self.cardboard_cubeable_id:
            self.cardboard_cubeable_id = self.cardboard_cubeable.id
        super().save(force_insert, force_update, using, update_fields)

    @property
    def elo(self) -> int:
        return self.rating

    @elo.setter
    def elo(self, value: int) -> None:
        self.rating = value
