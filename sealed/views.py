from django.db.models import Prefetch
from django.contrib.auth import get_user_model

from rest_framework import generics, permissions

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
            Prefetch('session__pools__user', queryset = get_user_model().objects.all().only('username')),
        ).order_by('-session__created_at')
