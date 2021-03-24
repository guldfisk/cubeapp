from abc import abstractmethod

from django.db.models import QuerySet, Prefetch
from django.http import Http404

from rest_framework import generics, status
from rest_framework.response import Response

from api.models import CubeRelease
from rating import serializers
from rating import models


class RatingMapDetail(generics.RetrieveAPIView):
    serializer_class = serializers.RatingMapSerializer
    queryset = models.RatingMap.objects.all().prefetch_related(
        'ratings',
        'node_rating_components',
        Prefetch(
            'children__release',
            queryset = CubeRelease.objects.all().only(
                'id',
                'name',
            ),
        ),
    )


class RelatedMap(generics.RetrieveAPIView):
    serializer_class = serializers.MinimalRatingMapSerializer

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


class CardboardCubeableRatingExample(generics.RetrieveAPIView):
    serializer_class = serializers.CardboardCubeableRatingSerializer

    def get_object(self):
        obj = models.CardboardCubeableRating.objects.filter(
            rating_map__release = self.kwargs['release_id'],
            cardboard_cubeable_id = self.kwargs['cardboard_cubeable_id'].replace('_', '/'),
        ).last()

        if obj is None:
            raise Http404('No rating maps for that release')

        self.check_object_permissions(self.request, obj)

        return obj


class NodeRatingComponentExample(generics.RetrieveAPIView):
    serializer_class = serializers.NodeRatingComponentSerializer

    def get_object(self):
        obj = models.NodeRatingComponent.objects.filter(
            rating_map__release = self.kwargs['release_id'],
            node_id = self.kwargs['node_id'].replace('_', '/'),
        ).last()

        if obj is None:
            raise Http404('No rating maps for that release')

        self.check_object_permissions(self.request, obj)

        return obj


class CardboardCubeableRatingHistory(generics.GenericAPIView):
    serializer_class = serializers.DatedCardboardCubeableRatingSerializer

    def get(self, request, *args, **kwargs):
        rating_map_id = models.RatingMap.objects.filter(
            release_id = kwargs['release_id']
        ).order_by('created_at').values_list('id', flat = True).last()
        if rating_map_id is None:
            return Response(status = status.HTTP_400_BAD_REQUEST)
        ratings = models.CardboardCubeableRating.objects.raw(
            '''
            SELECT * FROM rating_cardboardcubeablerating
            INNER JOIN rating_ratingmap on rating_cardboardcubeablerating.rating_map_id = rating_ratingmap.id
            WHERE rating_map_id IN (
                WITH RECURSIVE traverse_maps AS (
                    SELECT id, parent_id
                    FROM rating_ratingmap
                    WHERE id = %s
                    UNION
                    SELECT r.id, r.parent_id
                    FROM rating_ratingmap r
                    INNER JOIN traverse_maps s ON r.id = s.parent_id
                )
                SELECT id
                FROM traverse_maps
            ) AND cardboard_cubeable_id = %s
            ORDER BY rating_ratingmap.created_at;
            ''',
            [rating_map_id, kwargs['cardboard_id'].replace('_', '/')],
        ).prefetch_related(
            'rating_map',
            Prefetch(
                'rating_map__release',
                queryset = models.CubeRelease.objects.all().only(
                    'id',
                    'name',
                )
            ),
        )

        return Response(self.get_serializer(ratings, many = True).data)


class NodeRatingComponentHistory(generics.GenericAPIView):
    serializer_class = serializers.DatedNodeRatingComponentSerializer

    def get(self, request, *args, **kwargs):
        rating_map_id = models.RatingMap.objects.filter(
            release_id = kwargs['release_id']
        ).order_by('created_at').values_list('id', flat = True).last()
        if rating_map_id is None:
            return Response(status = status.HTTP_400_BAD_REQUEST)
        ratings = models.NodeRatingComponent.objects.raw(
            '''
            SELECT * FROM rating_noderatingcomponent
            INNER JOIN rating_ratingmap on rating_noderatingcomponent.rating_map_id = rating_ratingmap.id
            WHERE rating_map_id IN (
                WITH RECURSIVE traverse_maps AS (
                    SELECT id, parent_id
                    FROM rating_ratingmap
                    WHERE id = %s
                    UNION
                    SELECT r.id, r.parent_id
                    FROM rating_ratingmap r
                    INNER JOIN traverse_maps s ON r.id = s.parent_id
                )
                SELECT id
                FROM traverse_maps
            ) AND node_id = %s
            ORDER BY rating_ratingmap.created_at;
            ''',
            [rating_map_id, kwargs['node_id'].replace('_', '/')],
        ).prefetch_related(
            'rating_map',
            Prefetch(
                'rating_map__release',
                queryset = models.CubeRelease.objects.all().only(
                    'id',
                    'name',
                )
            ),
        )

        return Response(self.get_serializer(ratings, many = True).data)
