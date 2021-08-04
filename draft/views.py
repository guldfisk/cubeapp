from distutils.util import strtobool

from django.contrib.auth.models import AbstractUser
from django.db.models import Prefetch

from rest_framework import generics, status, permissions
from rest_framework.response import Response

from api.models import CubeRelease

from mtgdraft.client import draft_format_map

from api.serialization.orpserialize import CubeableSerializer
from limited.models import Pool
from draft import models, serializers


class DraftSessionList(generics.ListAPIView):
    serializer_class = serializers.DraftSessionSerializer

    _allowed_sort_keys = {
        'key': 'key',
        'draft_format': 'draft_format',
        'state': 'state',
        'started_at': 'started_at',
        'ended_at': 'ended_at',
    }

    def get_queryset(self):
        queryset = models.DraftSession.objects.all().prefetch_related(
            'seats',
            'seats__user',
            'pool_specification__specifications',
            Prefetch(
                'pool_specification__specifications__release',
                queryset = CubeRelease.objects.all().only(
                    'id',
                    'name',
                    'created_at',
                    'checksum',
                    'intended_size',
                    'versioned_cube_id',
                )
            ),
            'limited_session__pool_specification__specifications',
            Prefetch(
                'limited_session__pool_specification__specifications__release',
                queryset = CubeRelease.objects.all().only(
                    'id',
                    'name',
                    'created_at',
                    'checksum',
                    'intended_size',
                    'versioned_cube_id',
                )
            ),
            Prefetch(
                'limited_session__pools',
                queryset = Pool.objects.all().only(
                    'id',
                    'session_id',
                    'user_id',
                )
            ),
            'limited_session__pools__user',
        )

        draft_format_filter = self.request.GET.get('draft_format_filter')
        if draft_format_filter:
            if draft_format_filter not in draft_format_map:
                return Response(f'invalid format filter {draft_format_filter}', status = status.HTTP_400_BAD_REQUEST)

            queryset = queryset.filter(draft_format = draft_format_filter)

        state_filter = self.request.GET.get('state_filter')
        if state_filter:
            try:
                state = models.DraftSession.DraftState[state_filter]
            except KeyError:
                return Response(f'invalid state filter {state_filter}', status = status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(state = state)

        players_filter = self.request.GET.get('seats_filter')
        if players_filter:
            if not isinstance(players_filter, str):
                return Response(f'invalid player filter {players_filter}', status = status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(seats__user__username = players_filter)

        sort_key = [self._allowed_sort_keys.get(self.request.GET.get('sort_key'), 'started_at')]
        ascending = strtobool(self.request.GET.get('ascending', 'false'))

        if sort_key[0] != self._allowed_sort_keys['started_at']:
            sort_key.append(self._allowed_sort_keys['started_at'])

        if not ascending:
            sort_key[0] = '-' + sort_key[0]

        return queryset.order_by(*sort_key)


class DraftSessionDetail(generics.RetrieveAPIView):
    queryset = models.DraftSession.objects.all()
    serializer_class = serializers.DraftSessionSerializer


class SeatPermissions(permissions.BasePermission):

    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.DraftSeat):
        if request.user == obj.user:
            return True

        if obj.session.limited_session:
            if obj.session.limited_session.pools_public:
                return True

            if isinstance(request.user, AbstractUser):
                try:
                    pool = Pool.objects.get(
                        session = obj.session.limited_session,
                        user = request.user,
                    )
                except Pool.DoesNotExist:
                    return False

                if pool.can_view(request.user):
                    return True

        return False


class SeatView(generics.GenericAPIView):
    queryset = models.DraftSeat.objects.all()
    permission_classes = [SeatPermissions]

    def get(self, request, *args, **kwargs):
        seat: models.DraftSeat = self.get_object()
        picks = list(seat.picks.all().order_by('global_pick_number')[:int(kwargs['pick']) + 1])
        return Response(
            {
                'seat': serializers.DraftSeatSerializer(seat, context = {'request': request}).data,
                'pool': [
                    [
                        CubeableSerializer.serialize(cubeable, request)
                        for cubeable in
                        pick.pick.added_cubeables
                    ]
                    for pick in
                    picks[:-1]
                ],
                'pick': serializers.DraftPickSerializer(
                    picks[-1],
                    context = {'request': request},
                ).data if picks else None,
                'pick_count': seat.picks.all().count(),
            }
        )
