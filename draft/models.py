from __future__ import annotations

import itertools
import typing as t
from enum import Enum

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.db.models import Count, QuerySet

from typedmodels.models import TypedModel

from mtgorp.models.formats.format import LimitedSideboard

from magiccube.collections.cubeable import Cubeable
from magiccube.collections.infinites import Infinites

from mtgdraft.models import DraftBooster, Pick

from api.fields.orp import OrpField
from limited.models import PoolSpecification, LimitedSession, CubeBoosterSpecification
from utils.fields import EnumField
from utils.mixins import TimestampedModel


class DraftSessionQueryset(QuerySet):

    def competitive_drafts(self) -> QuerySet:
        return self.annotate(
            specifications_count = Count(
                'pool_specification__specifications',
                distinct = True,
            ),
            seat_count = Count('seats', distinct = True),
        ).filter(
            state = DraftSession.DraftState.COMPLETED,
            specifications_count = 1,
            seat_count__gt = 1,
            limited_session__format = LimitedSideboard.name,
            pool_specification__specifications__type = CubeBoosterSpecification._typedmodels_type,
            pool_specification__specifications__release__versioned_cube__active = True,
            pool_specification__specifications__allow_intersection = False,
            pool_specification__specifications__allow_repeat = False,
        )


class DraftSession(models.Model):
    class DraftState(Enum):
        DRAFTING = 0
        COMPLETED = 1
        ABANDONED = 2

    started_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    key = models.CharField(max_length = 255)
    ended_at = models.DateTimeField(null = True)
    draft_format = models.CharField(max_length = 127)
    reverse = models.BooleanField()
    time_control = models.FloatField(null = True)
    state = EnumField(DraftState, default = DraftState.DRAFTING)
    infinites: Infinites = OrpField(model_type = Infinites)
    pool_specification = models.ForeignKey(
        PoolSpecification,
        on_delete = models.CASCADE,
        related_name = 'draft_sessions',
    )
    limited_session = models.ForeignKey(
        LimitedSession,
        on_delete = models.CASCADE,
        related_name = 'draft_session',
        null = True,
    )
    rating_maps = GenericRelation(
        'rating.RatingMap',
        'ratings_for_object_id',
        'ratings_for_content_type',
    )

    objects = DraftSessionQueryset.as_manager()

    @property
    def users(self):
        return (seat.user for seat in self.seats.all())

    def get_absolute_url(self) -> str:
        return f'/drafts/{self.id}'


class DraftSeat(models.Model):
    sequence_number = models.PositiveSmallIntegerField()
    user = models.ForeignKey(get_user_model(), on_delete = models.PROTECT, related_name = 'seats')
    session = models.ForeignKey(DraftSession, on_delete = models.CASCADE, related_name = 'seats')

    class Meta:
        ordering = ['sequence_number']


class DraftPick(models.Model):
    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    seat = models.ForeignKey(DraftSeat, on_delete = models.CASCADE, related_name = 'picks')
    global_pick_number = models.PositiveSmallIntegerField()
    pack_number = models.PositiveSmallIntegerField()
    pick_number = models.PositiveSmallIntegerField()
    pack: DraftBooster = OrpField(DraftBooster)
    pick: Pick = OrpField(Pick)
    booster_id = models.CharField(max_length = 36)

    printings = GenericRelation(
        'api.RelatedPrinting',
        'related_object_id',
        'related_content_type',
    )

    @property
    def cubeables(self) -> t.Iterator[Cubeable]:
        return itertools.chain(self.pick.picked, self.pack.cubeables)

    class Meta:
        unique_together = (
            ('seat', 'global_pick_number'),
            ('seat', 'pack_number', 'pick_number'),
            ('booster_id', 'pick_number'),
        )
