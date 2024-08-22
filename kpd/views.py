from rest_framework import generics, permissions
from rest_framework.request import Request
from rest_framework.response import Response

from kpd import models, serializers
from kpd.service import create_session, get_authentication_redirect


class BankPermissions(permissions.BasePermission):
    def has_permission(self, request: Request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class PointList(generics.ListAPIView):
    serializer_class = serializers.LogPointSerializer
    queryset = models.LogPoint.objects.order_by("timestamp")
    pagination_class = None

    def filter_queryset(self, queryset):
        return queryset.filter(type=self.kwargs["query"])


class GetAuthenticationLink(generics.GenericAPIView):
    permission_classes = [BankPermissions]

    def post(self, request, *args, **kwargs):
        return Response(
            {
                "url": get_authentication_redirect(),
            }
        )


class CreateSession(generics.GenericAPIView):
    permission_classes = [BankPermissions]

    def post(self, request, code: str, *args, **kwargs):
        return Response(
            {
                "valid_until": create_session(code).valid_until.isoformat(),
            }
        )
