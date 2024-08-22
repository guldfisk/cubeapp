from rest_framework import serializers

from api.serialization.serializers import NameCubeReleaseSerializer
from draft.serializers import DraftPickSerializer, DraftSeatSerializer
from imgqty import models


class ImageQtyRecordPackSerializer(serializers.ModelSerializer):
    pick = DraftPickSerializer()
    release = NameCubeReleaseSerializer()
    seat = DraftSeatSerializer(source="pick.seat")

    class Meta:
        model = models.ImageQtyRecordPack
        fields = ("id", "pick", "release", "image_amount", "average_image_amount", "probability", "seat")
