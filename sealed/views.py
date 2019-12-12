from rest_framework import generics, permissions

from sealed import models, serializers


class PoolDetail(generics.RetrieveDestroyAPIView):
    queryset = models.Pool.objects.all()
    lookup_field = 'key'
    serializer_class = serializers.PoolSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]
