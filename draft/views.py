from distutils.util import strtobool

from rest_framework import generics, status
from rest_framework.response import Response

from mtgdraft.client import draft_format_map

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
            'pool_specification__specifications',
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


class SeatView(generics.GenericAPIView):

    def get(self, request, *args, **kwargs):
        pass
