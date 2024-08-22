from __future__ import annotations

from django.db import models

from api.models import CubeRelease
from draft.models import DraftPick, DraftSession


class DraftChecked(models.Model):
    draft = models.ForeignKey(DraftSession, on_delete=models.PROTECT, related_name="image_quantity_checks")


class ImageQtyRecordPack(models.Model):
    pick = models.ForeignKey(DraftPick, on_delete=models.PROTECT, related_name="image_records")
    release = models.ForeignKey(CubeRelease, on_delete=models.PROTECT, related_name="booster_image_records")
    image_amount = models.IntegerField()
    average_image_amount = models.FloatField()
    probability = models.FloatField()
