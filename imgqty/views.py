from django.db.models import Prefetch

from rest_framework import generics
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from api.models import VersionedCube, CubeRelease
from imgqty import models, serializers
from imgqty.service import ImageQtyProbabilityManager


class RecordPackDetail(generics.RetrieveAPIView):
    serializer_class = serializers.ImageQtyRecordPackSerializer
    queryset = models.ImageQtyRecordPack.objects.all().select_related('pick')


class ReleaseImageDistribution(generics.RetrieveAPIView):
    queryset = models.CubeRelease.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        manager = ImageQtyProbabilityManager(instance.cube, kwargs['pack_size'])
        return Response(
            {
                'probability_distribution_points': [
                    [
                        image_amount,
                        manager.image_sum_quantity_probability(image_amount),
                    ]
                    for image_amount in
                    manager.qty_range
                ],
                'cumulative_points': [
                    [
                        image_amount,
                        manager.probability_at_least_images(image_amount),
                    ]
                    for image_amount in
                    manager.qty_range
                ],
            }
        )


class RecordsForVersionedCube(generics.ListAPIView):
    serializer_class = serializers.ImageQtyRecordPackSerializer
    queryset = VersionedCube.objects.all().only('id')

    def get_object(self):
        queryset = self.queryset.all()

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)

        self.check_object_permissions(self.request, obj)

        return obj

    def get_queryset(self):
        versioned_cube: VersionedCube = self.get_object()
        return models.ImageQtyRecordPack.objects.filter(
            release__versioned_cube_id = versioned_cube.id,
        ).order_by('-pick__created_at').select_related('pick').prefetch_related(
            'pick__seat__user',
            Prefetch(
                'release',
                queryset = CubeRelease.objects.all().only(
                    'id',
                    'name',
                ),
            ),
        )
