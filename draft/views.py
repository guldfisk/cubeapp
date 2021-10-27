from distutils.util import strtobool

from django.contrib.auth.models import AbstractUser
from django.contrib.contenttypes.models import ContentType
from django.db.models import Prefetch, Q, Exists, OuterRef
from django.shortcuts import get_object_or_404

from rest_framework import generics, status, permissions
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

from mtgorp.models.serilization.strategies.raw import RawStrategy
from mtgorp.tools.parsing.exceptions import ParseException
from mtgorp.tools.parsing.search.parse import SearchParser
from mtgorp.tools.search.extraction import PrintingStrategy
from mtgorp.tools.search.pattern import Pattern

from magiccube.collections.cube import Cube

from mtgdraft.client import draft_format_map

from api.models import CubeRelease, RelatedPrinting
from api.serialization.orpserialize import CubeableSerializer, CubeSerializer
from draft import models, serializers
from limited.models import Pool
from resources.staticdb import db


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
        if picks:
            current_pick = picks[-1]
            try:
                previous_pick = models.DraftPick.objects.get(
                    booster_id = current_pick.booster_id,
                    pick_number = current_pick.pick_number - 1
                )
            except models.DraftPick.DoesNotExist:
                previous_pick = None
            try:
                next_pick = models.DraftPick.objects.get(
                    booster_id = current_pick.booster_id,
                    pick_number = current_pick.pick_number + 1
                )
            except models.DraftPick.DoesNotExist:
                next_pick = None
        else:
            current_pick = None
            previous_pick = None
            next_pick = None

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
                    current_pick,
                    context = {'request': request},
                ).data if current_pick else None,
                'pick_count': seat.picks.all().count(),
                'previous_seat': serializers.DraftPickSeatSerializer(previous_pick).data if previous_pick else None,
                'next_seat': serializers.DraftPickSeatSerializer(next_pick).data if next_pick else None,
            }
        )


class PickSearchPermissions(permissions.BasePermission):

    def has_object_permission(self, request, view, obj: models.DraftSession):
        if obj.limited_session:
            return obj.limited_session.pools_public
        return False


class PickSearch(generics.ListAPIView):
    queryset = models.DraftSession.objects.filter(
        state__in = (models.DraftSession.DraftState.COMPLETED, models.DraftSession.DraftState.ABANDONED)
    ).filter().only('id')
    permission_classes = [PickSearchPermissions]

    _pattern: Pattern

    def get_object(self) -> models.DraftSession:
        queryset = self.queryset.all()
        obj = get_object_or_404(queryset, **{'pk': self.kwargs['pk']})
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        draft_session = self.get_object()
        return models.DraftPick.objects.filter(
            seat__session_id = draft_session.id,
            pick_number = 1,
        ).order_by('global_pick_number', 'seat__sequence_number')

    def filter_queryset(self, queryset):
        return queryset.filter(
            Q(
                Exists(
                    RelatedPrinting.objects.filter(
                        related_object_id = OuterRef('pk'),
                        related_content_type_id = ContentType.objects.get_for_model(models.DraftPick),
                        printing_id__in = [
                            p.id
                            for p in
                            db.printings.values()
                            if self._pattern.match(p)
                        ],
                    )
                )
            )
        )

    def list(self, request, *args, **kwargs):
        try:
            self._pattern = SearchParser(db).parse(self.kwargs['query'], PrintingStrategy)
        except ParseException as e:
            raise ParseError(str(e))

        queryset = self.filter_queryset(self.get_queryset())

        native = strtobool(request.query_params.get('native', '0'))

        hits = []

        for pick in self.paginate_queryset(queryset):
            matches = Cube(pick.cubeables).filter(self._pattern)
            hits.append(
                {
                    'pick': serializers.FullDraftPickSeatSerializer(pick, context = {'request': request}).data,
                    'matches': RawStrategy.serialize(matches) if native else CubeSerializer.serialize(matches),
                }
            )

        return self.get_paginated_response(hits)
