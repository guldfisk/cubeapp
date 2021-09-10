from rest_framework import generics, permissions
from rest_framework.request import Request
from rest_framework.response import Response

from kpd import models, serializers
from kpd.service import get_authentication_redirect, create_session


class BankPermissions(permissions.BasePermission):

    def has_permission(self, request: Request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class PointList(generics.ListAPIView):
    serializer_class = serializers.KebabPointSerializer
    queryset = models.KebabPoint.objects.all().order_by('timestamp')
    pagination_class = None


class GetAuthenticationLink(generics.GenericAPIView):
    permission_classes = [BankPermissions]

    def post(self, request, *args, **kwargs):
        return Response(
            {
                'url': get_authentication_redirect(),
            }
        )


class CreateSession(generics.GenericAPIView):
    permission_classes = [BankPermissions]

    def post(self, request, code: str, *args, **kwargs):
        return Response(
            {
                'valid_until': create_session(code).valid_until.isoformat(),
            }
        )
