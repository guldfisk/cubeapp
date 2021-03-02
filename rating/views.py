from abc import abstractmethod

from django.db.models import F, QuerySet
from django.http import Http404
from django.shortcuts import get_object_or_404

from rest_framework import generics
from rest_framework.response import Response

from api.models import VersionedCube

from rating import serializers
from rating import models


class RatingMapDetail(generics.RetrieveAPIView):
    serializer_class = serializers.RatingMapSerializer
    queryset = models.RatingMap.objects.all()


class RelatedMap(generics.RetrieveAPIView):
    serializer_class = serializers.RatingMapSerializer

    @abstractmethod
    def filter_qs(self, qs: QuerySet, pk: int) -> QuerySet:
        pass

    def get_object(self):
        queryset = self.filter_qs(
            models.RatingMap.objects.order_by('created_at'),
            self.kwargs[self.lookup_url_kwarg or self.lookup_field],
        )

        obj = queryset.last()

        if obj is None:
            raise Http404('No rating maps for that release')

        self.check_object_permissions(self.request, obj)

        return obj


class ReleaseLatestMapDetail(RelatedMap):

    def filter_qs(self, qs: QuerySet, pk: int) -> QuerySet:
        return qs.filter(release_id = pk).order_by('created_at')


class VersionedCubeLatestMapDetail(RelatedMap):

    def filter_qs(self, qs: QuerySet, pk: int) -> QuerySet:
        return qs.filter(release__versioned_cube_id = pk).order_by('created_at')


class CardboardCubeableRatingHistory(generics.GenericAPIView):
    serializer_class = serializers.DatedCardboardCubeableRatingSerializer

    def get_serializer(self, *args, **kwargs):
        return super().get_serializer(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        versioned_cube = get_object_or_404(VersionedCube, pk=kwargs['pk'])
        v = models.CardboardCubeableRating.objects.filter(
            rating_map__release__versioned_cube_id = versioned_cube.id,
            cardboard_cubeable_id = kwargs['cardboard_id'],
        ).annotate(
            created_at = F('rating_map__created_at')
        ).order_by('created_at')
        serializer = self.get_serializer(v, many = True)
        return Response(serializer.data)
