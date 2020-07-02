import datetime

from distutils.util import strtobool
from json import JSONDecodeError

from django.db import transaction
from django.db.models import Prefetch
from django.contrib.auth import get_user_model

from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.response import Response

from mtgorp.models.serilization.strategies.raw import RawStrategy
from mtgorp.models.formats.format import Format
from mtgorp.models.collections.deck import Deck
from mtgorp.models.serilization.serializeable import SerializationException
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.tools.deckio import DeckSerializer

from magiccube.tools.subset import check_deck_subset_pool

from resources.staticdb import db

from limited import models, serializers


class PoolDetailPermissions(permissions.BasePermission):

    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.Pool):
        return obj.can_view(request.user)


class PoolDetail(generics.RetrieveDestroyAPIView):
    queryset = models.Pool.objects.all().select_related(
        'user',
    ).prefetch_related(
        'pool_deck',
    )
    serializer_class = serializers.PoolSerializer
    permission_classes = [PoolDetailPermissions, ]

    def get_serializer(self, *args, **kwargs):
        serializer_class = (
            serializers.FullPoolSerializer
            if args[0].deck and args[0].deck.can_view(self.request.user) else
            serializers.PoolSerializer
        )
        kwargs['context'] = self.get_serializer_context()
        return serializer_class(*args, **kwargs)

    def post(self, request: Request, *args, **kwargs) -> Response:
        try:
            pool = models.Pool.objects.select_related('session').get(id = kwargs['pk'], user = request.user)
        except models.Pool.DoesNotExist:
            return Response(status = status.HTTP_404_NOT_FOUND)

        if not pool.session.state == models.LimitedSession.LimitedSessionState.DECK_BUILDING:
            return Response(status = status.HTTP_405_METHOD_NOT_ALLOWED)

        try:
            deck = JsonId(db).deserialize(Deck, request.data.get('deck', '{}'))
        except (SerializationException, JSONDecodeError):
            return Response({'errors': ['invalid deck definition']}, status = status.HTTP_400_BAD_REQUEST)

        valid, error = check_deck_subset_pool(
            pool.pool,
            deck.seventy_five,
            {
                db.cardboards[name]
                for name in
                (
                    'Plains',
                    'Island',
                    'Swamp',
                    'Mountain',
                    'Forest',
                )
            },
        )

        if not valid:
            return Response({'errors': [error]}, status = status.HTTP_400_BAD_REQUEST)

        game_format = Format.formats_map.get(pool.session.format)

        if game_format is not None:
            valid, errors = game_format.deckcheck(deck)
            if not valid:
                return Response({'errors': errors}, status = status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            pool_deck = models.PoolDeck.objects.create(
                deck = deck,
                pool = pool,
                name = request.data.get('name', 'deck'),
            )

            if all(models.Pool.objects.filter(session = pool.session).values_list('pool_deck', flat = True)):
                pool.session.state = models.LimitedSession.LimitedSessionState.PLAYING
                pool.session.playing_at = datetime.datetime.now()
                pool.session.save(update_fields = ('state', 'playing_at'))

        return Response(
            serializers.PoolDeckSerializer(pool_deck, context = {'request': request}).data,
            status = status.HTTP_201_CREATED,
        )


class PoolExport(generics.GenericAPIView):
    queryset = models.Pool.objects.all()
    permission_classes = [PoolDetailPermissions]

    def get(self, request: Request, *args, **kwargs) -> Response:
        return Response(
            status = status.HTTP_200_OK,
            content_type = 'application/text',
            data = JsonId.serialize(self.get_object().pool),
        )


class DeckPermissions(permissions.IsAuthenticated):

    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.PoolDeck):
        return obj.can_view(request.user)


class DeckDetail(generics.RetrieveAPIView):
    queryset = models.PoolDeck.objects.all()
    serializer_class = serializers.PoolDeckSerializer
    permission_classes = [DeckPermissions]


class DeckList(generics.ListAPIView):
    queryset = models.PoolDeck.objects.filter(
        pool__session__state = models.LimitedSession.LimitedSessionState.FINISHED,
    ).select_related(
        'pool__user'
    ).prefetch_related(
        Prefetch(
            'pool__session',
            queryset = models.LimitedSession.objects.all().only(
                'id',
                'name',
                'state',
            )
        ),
    ).order_by(
        '-created_at',
    )
    serializer_class = serializers.FullPoolDeckSerializer


class DeckExport(generics.GenericAPIView):
    queryset = models.PoolDeck.objects.all()
    permission_classes = [DeckPermissions]

    def get(self, request: Request, *args, **kwargs) -> Response:
        try:
            serializer = DeckSerializer.extension_to_serializer[request.query_params.get('extension', 'dec')]
        except KeyError:
            return Response(
                data = 'Invalid extension',
                status = status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            status = status.HTTP_200_OK,
            content_type = 'application/octet-stream',
            data = serializer.serialize(self.get_object().deck),
        )


class SessionList(generics.ListAPIView):
    serializer_class = serializers.LimitedSessionSerializer

    _allowed_sort_keys = {
        'name': 'name',
        'format': 'format',
        'game_type': 'game_type',
        'state': 'state',
        'created_at': 'created_at',
        'playing_at': 'playing_at',
        'finished_at': 'finished_at',
    }

    def get_queryset(self):
        queryset = models.LimitedSession.objects.all().prefetch_related(
            'pool_specification__specifications',
            Prefetch(
                'pool_specification__specifications__release',
                queryset = models.CubeRelease.objects.all().only(
                    'id',
                    'name',
                    'created_at',
                    'checksum',
                    'intended_size',
                    'versioned_cube_id',
                )
            ),
            Prefetch(
                'pools',
                queryset = models.Pool.objects.all().only(
                    'id',
                    'session_id',
                    'user_id',
                )
            ),
            'pools__user',
            'results',
            'results__players',
            'results__players__user',
        )
        name_filter = self.request.GET.get('name_filter')
        if name_filter:
            if not isinstance(name_filter, str):
                return Response(f'invalid name filter {name_filter}', status = status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(name__contains = name_filter)

        format_filter = self.request.GET.get('format_filter')
        if format_filter:
            try:
                game_format = Format.formats_map[format_filter]
            except KeyError:
                return Response(f'invalid format filter {format_filter}', status = status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(format = game_format.name)

        game_type_filter = self.request.GET.get('game_type_filter')
        if game_type_filter:
            queryset = queryset.filter(game_type = game_type_filter)

        state_filter = self.request.GET.get('state_filter')
        if state_filter:
            try:
                state = models.LimitedSession.LimitedSessionState[state_filter]
            except KeyError:
                return Response(f'invalid state filter {state_filter}', status = status.HTTP_400_BAD_REQUEST)
            comparator = {
                '=': '',
                '!=': None,
                '<': '__lt',
                '<=': '__lte',
                '>': '__gt',
                '>=': '__gte',
            }.get(
                self.request.GET.get('state_filter_comparator'),
                '',
            )
            if comparator is None:
                queryset = queryset.exclude(state = state)
            else:
                queryset = queryset.filter(
                    **{
                        'state' + comparator: state
                    }
                )

        players_filter = self.request.GET.get('players_filter')
        if players_filter:
            if not isinstance(players_filter, str):
                return Response(f'invalid player filter {players_filter}', status = status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(pools__user__username = players_filter)

        sort_key = [self._allowed_sort_keys.get(self.request.GET.get('sort_key'), 'created_at')]
        ascending = strtobool(self.request.GET.get('ascending', 'false'))

        if sort_key[0] != self._allowed_sort_keys['created_at']:
            sort_key.append(self._allowed_sort_keys['created_at'])

        if not ascending:
            sort_key[0] = '-' + sort_key[0]

        return queryset.order_by(*sort_key)

    # def list(self, request, *args, **kwargs):
    #     queryset = self.get_queryset()
    #
    #     name_filter = request.GET.get('name_filter')
    #     if name_filter:
    #         if not isinstance(name_filter, str):
    #             return Response(f'invalid name filter {name_filter}', status = status.HTTP_400_BAD_REQUEST)
    #         queryset = queryset.filter(name__contains = name_filter)
    #
    #     format_filter = request.GET.get('format_filter')
    #     if format_filter:
    #         try:
    #             game_format = Format.formats_map[format_filter]
    #         except KeyError:
    #             return Response(f'invalid format filter {format_filter}', status = status.HTTP_400_BAD_REQUEST)
    #         queryset = queryset.filter(format = game_format.name)
    #
    #     game_type_filter = request.GET.get('game_type_filter')
    #     if game_type_filter:
    #         queryset = queryset.filter(game_type = game_type_filter)
    #
    #     state_filter = request.GET.get('state_filter')
    #     if state_filter:
    #         try:
    #             state = models.LimitedSession.LimitedSessionState[state_filter]
    #         except KeyError:
    #             return Response(f'invalid state filter {state_filter}', status = status.HTTP_400_BAD_REQUEST)
    #         comparator = {
    #             '=': '',
    #             '!=': None,
    #             '<': '__lt',
    #             '<=': '__lte',
    #             '>': '__gt',
    #             '>=': '__gte',
    #         }.get(
    #             request.GET.get('state_filter_comparator'),
    #             '',
    #         )
    #         if comparator is None:
    #             queryset = queryset.exclude(state = state)
    #         else:
    #             queryset = queryset.filter(
    #                 **{
    #                     'state' + comparator: state
    #                 }
    #             )
    #
    #     players_filter = request.GET.get('players_filter')
    #     if players_filter:
    #         if not isinstance(players_filter, str):
    #             return Response(f'invalid player filter {players_filter}', status = status.HTTP_400_BAD_REQUEST)
    #         queryset = queryset.filter(pools__user__username = players_filter)
    #
    #     sort_key = [self._allowed_sort_keys.get(request.GET.get('sort_key'), 'created_at')]
    #     ascending = strtobool(request.GET.get('ascending', 'false'))
    #
    #     if sort_key[0] != self._allowed_sort_keys['created_at']:
    #         sort_key.append(self._allowed_sort_keys['created_at'])
    #
    #     if not ascending:
    #         sort_key[0] = '-' + sort_key[0]
    #
    #     queryset = queryset.order_by(*sort_key)
    #
    #     page = self.paginate_queryset(queryset)
    #
    #     if page is not None:
    #         serializer = self.get_serializer(page, many = True)
    #         return self.get_paginated_response(serializer.data)
    #
    #     serializer = self.get_serializer(queryset, many = True)
    #     return Response(serializer.data)


class SessionDetail(generics.RetrieveDestroyAPIView):
    serializer_class = serializers.FullLimitedSessionSerializer
    queryset = models.LimitedSession.objects.all().prefetch_related(
        Prefetch('pools__pool_deck', queryset = models.PoolDeck.objects.all().only('id')),
        Prefetch('pools__user', queryset = get_user_model().objects.all().only('username')),
        'results',
        'results__players',
        Prefetch('results__players__user', queryset = get_user_model().objects.all().only('username')),
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class SessionResultsPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.LimitedSession):
        return obj.pools.filter(user_id = request.user.id).exists()


class CompleteSession(generics.GenericAPIView):
    queryset = models.LimitedSession.objects.all()
    permission_classes = [SessionResultsPermission, ]

    def post(self, request: Request, *args, **kwargs) -> Response:
        session: models.LimitedSession = self.get_object()
        if not session.state == models.LimitedSession.LimitedSessionState.PLAYING:
            return Response(
                'Cannot complete limited session that is not playing',
                status = status.HTTP_400_BAD_REQUEST,
            )
        session.complete()
        return Response(status = status.HTTP_200_OK)


class SubmitResult(generics.GenericAPIView):
    queryset = models.LimitedSession.objects.all()
    permission_classes = [SessionResultsPermission, ]

    def post(self, request: Request, *args, **kwargs) -> Response:
        limited_session: models.LimitedSession = self.get_object()

        if not limited_session.state == models.LimitedSession.LimitedSessionState.PLAYING:
            return Response(
                'Session in invalid state for submitting results',
                status = status.HTTP_400_BAD_REQUEST,
            )

        serializer = serializers.MatchResultSerializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        if not (
            serializer.validated_data['draws']
            + sum(player['wins'] for player in serializer.validated_data['players'])
        ):
            return Response(
                'At least one game must be completed',
                status = status.HTTP_400_BAD_REQUEST,
            )

        if len(serializer.validated_data['players']) <= 1:
            return Response(
                'Match result must include more than one player',
                status = status.HTTP_400_BAD_REQUEST,
            )

        user_ids = [player['user_id'] for player in serializer.validated_data['players']]
        user_id_set = set(user_ids)
        if (
            not len(user_ids) == len(user_id_set)
            or not user_id_set <= set(limited_session.pools.all().values_list('user_id', flat = True))
        ):
            return Response(
                'Invalid users',
                status = status.HTTP_400_BAD_REQUEST,
            )

        if any(
            user_id_set == set(_match_result.players.all().values_list('user_id', flat = True))
                for _match_result in
                models.MatchResult.objects.filter(session = limited_session).prefetch_related(
                    Prefetch('players__user', queryset = get_user_model().objects.all().only('username')),
                )
        ):
            return Response(
                'Result already posted for this match',
                status = status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            match_result = models.MatchResult.objects.create(
                session = limited_session,
                draws = serializer.validated_data['draws']
            )
            for player in serializer.validated_data['players']:
                models.MatchPlayer.objects.create(
                    user_id = player['user_id'],
                    wins = player['wins'],
                    match_result = match_result,
                )
            if limited_session.results.all().count() >= limited_session.expected_match_amount:
                limited_session.complete()

        return Response(status = status.HTTP_200_OK)
