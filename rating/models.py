from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from magiccube.laps.traps.tree.printingtree import CardboardNode, PrintingNode

from api.fields.orp import CardboardCubeableField, CubeableField, CardboardNodeChildField, PrintingNodeChildField, CardboardField
from api.models import CubeRelease
from mtgorp.models.interfaces import Cardboard
from utils.mixins import TimestampedModel


class RatingMap(TimestampedModel, models.Model):
    release = models.ForeignKey(CubeRelease, on_delete = models.CASCADE, related_name = 'rating_maps')
    ratings_for_content_type = models.ForeignKey(ContentType, on_delete = models.CASCADE)
    ratings_for_object_id = models.PositiveIntegerField()
    ratings_for = GenericForeignKey('ratings_for_content_type', 'ratings_for_object_id', )
    parent = models.ForeignKey(
        'RatingMap',
        related_name = 'children',
        null = True,
        on_delete = models.SET_NULL,
    )

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


class NodeRatingComponent(models.Model):
    rating_map = models.ForeignKey(RatingMap, on_delete = models.CASCADE, related_name = 'node_rating_components')
    node: CardboardNode = CardboardNodeChildField()
    node_id = models.CharField(max_length = 2047)
    example_node: PrintingNode = PrintingNodeChildField()
    rating_component = models.PositiveSmallIntegerField()
    weight = models.DecimalField(max_digits = 8, decimal_places = 2)

    class Meta:
        unique_together = ('node_id', 'rating_map')
        ordering = ('-rating_component',)

    def save(self, force_insert = False, force_update = False, using = None, update_fields = None):
        if not self.node_id:
            self.node_id = self.node.persistent_hash()
        super().save(force_insert, force_update, using, update_fields)


class CardboardStat(models.Model):
    rating_map = models.ForeignKey(RatingMap, on_delete = models.CASCADE, related_name = 'cardboard_statistics')
    cardboard: Cardboard = CardboardField()
    stat = models.CharField(max_length = 63)
    value = models.FloatField()

    # pool_occurrences = models.FloatField()
    # maindeck_occurrences = models.FloatField()
    #
    # sideboard_occurrences = models.FloatField()
    # real_sideboard_occurrences = models.IntegerField()
    # maindeck_matches = models.FloatField()
    # real_maindeck_matches = models.IntegerField()
    # sideboard_matches = models.FloatField()
    # real_sideboard_matches = models.IntegerField()
    # maindeck_wins = models.FloatField()
    # real_maindeck_wins = models.IntegerField()
    # sideboard_wins = models.FloatField()
    # real_sideboard_wins = models.IntegerField()
    #
    # deck_occurrences = models.FloatField()
    # real_deck_occurrences = models.IntegerField()
    #
    # deck_conversion_rate = models.FloatField()
    # ci_deck_conversion_rate = models.FloatField()
    #
    # maindeck_conversion_rate = models.FloatField()
    # ci_maindeck_conversion_rate = models.FloatField()
    # sideboard_conversion_rate = models.FloatField()
    # ci_sideboard_conversion_rate = models.FloatField()
    #
    # matches = models.FloatField()
    # real_matches = models.IntegerField()
    # wins = models.FloatField()
    # real_wins = models.IntegerField()
    # win_rate = models.FloatField()
    # ci_win_rate = models.FloatField()
    # maindeck_win_rate = models.FloatField()
    # ci_maindeck_win_rate = models.FloatField()
    # sideboard_win_rate = models.FloatField()
    # ci_sideboard_win_rate = models.FloatField()
    #
    class Meta:
        unique_together = ('cardboard', 'rating_map', 'stat')
