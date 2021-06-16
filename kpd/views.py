from rest_framework import generics

from kpd import models, serializers


class PointList(generics.ListAPIView):
    serializer_class = serializers.KebabPointSerializer
    queryset = models.KebabPoint.objects.all().order_by('timestamp')
    pagination_class = None
