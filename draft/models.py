from __future__ import annotations

from enum import Enum

from django.contrib.auth import get_user_model
from django.db import models

from typedmodels.models import TypedModel

from mtgdraft.models import Booster, Pick

from api.fields.orp import OrpField
from api.models import CubeRelease
from limited.models import PoolSpecification, LimitedSession
from utils.fields import EnumField
from utils.mixins import TimestampedModel


class DraftSession(models.Model):
    class DraftState(Enum):
        DRAFTING = 0
        COMPLETED = 1
        ABANDONED = 2

    started_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    key = models.CharField(max_length = 255)
    ended_at = models.DateTimeField(null = True)
    draft_format = models.CharField(max_length = 127)
    state = EnumField(DraftState, default = DraftState.DRAFTING)
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

    @property
    def users(self):
        return (seat.user for seat in self.seats.all())


class DraftSeat(models.Model):
    sequence_number = models.PositiveSmallIntegerField()
    user = models.ForeignKey(get_user_model(), on_delete = models.PROTECT, related_name = 'seats')
    session = models.ForeignKey(DraftSession, on_delete = models.CASCADE, related_name = 'seats')

    class Meta:
        ordering = ['sequence_number']


class DraftPick(models.Model):
    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    seat = models.ForeignKey(DraftSeat, on_delete = models.CASCADE, related_name = 'picks')
    pack_number = models.PositiveSmallIntegerField()
    pick_number = models.PositiveSmallIntegerField()
    pack = OrpField(Booster)
    pick = OrpField(Pick)
