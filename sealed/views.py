from django.db.models import Prefetch
from rest_framework import generics, permissions
from rest_framework.request import Request
from rest_framework.response import Response

from api.models import CubeRelease
from sealed import models, serializers


class PoolDetail(generics.RetrieveDestroyAPIView):
    queryset = models.Pool.objects.all()
    lookup_field = 'key'
    serializer_class = serializers.PoolSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class PoolList(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = serializers.MinimalPoolSerializer

    def get_queryset(self):
        return models.Pool.objects.filter(
            user = self.request.user,
        ).prefetch_related(
            'session',
            Prefetch('session__release', queryset = CubeRelease.objects.all().only('name')),
        ).order_by('-session__created_at')

    # def list(self, request, *args, **kwargs):
    #     return self.get_paginated_response(
    #         [
    #             serializers.PoolSerializer(pool).data
    #             for pool in
    #             self.paginate_queryset(
    #
    #             )
    #         ]
    #     )
