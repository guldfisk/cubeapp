import datetime

from distutils.util import strtobool
from json import JSONDecodeError

from django.db import transaction
from django.db.models import Prefetch, Count
from django.contrib.auth import get_user_model

from mtgorp.models.formats.format import Format

from magiccube.tools.subset import check_deck_subset_pool

from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.response import Response

from mtgorp.models.collections.deck import Deck
from mtgorp.models.serilization.serializeable import SerializationException
from mtgorp.models.serilization.strategies.jsonid import JsonId

from api.models import CubeRelease

from resources.staticdb import db

from limited import models, serializers


class PoolDetailPermissions(permissions.BasePermission):

    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.Pool):
        return (
            request.user == obj.user
            or obj.session.state.value > models.LimitedSession.LimitedSessionState.PLAYING.value
            or (
                obj.session.state == models.LimitedSession.LimitedSessionState.DECK_BUILDING
                and obj.session.open_decks
            )
        )


class PoolDetail(generics.RetrieveDestroyAPIView):
    queryset = models.Pool.objects.all().select_related(
        'user',
    ).prefetch_related(
        'decks'
    )
    serializer_class = serializers.PoolSerializer
    permission_classes = [PoolDetailPermissions, ]

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

            if all(models.Pool.objects.filter(session = pool.session).values_list(Count('decks'), flat = True)):
                pool.session.state = models.LimitedSession.LimitedSessionState.PLAYING
                pool.session.playing_at = datetime.datetime.now()
                pool.session.save(update_fields = ('state', 'playing_at'))

        return Response(
            serializers.PoolDeckSerializer(pool_deck, context = {'request': request}).data,
            status = status.HTTP_201_CREATED,
        )


class DeckPermissions(permissions.IsAuthenticated):

    def has_object_permission(self, request, view, obj: models.PoolDeck):
        return obj.pool.user == request.user


class DeckDetail(generics.RetrieveAPIView):
    queryset = models.PoolDeck.objects.all()
    serializer_class = serializers.PoolDeckSerializer
    permission_classes = [DeckPermissions]


class SessionList(generics.ListAPIView):
    serializer_class = serializers.SealedSessionSerializer
    queryset = models.LimitedSession.objects.all().prefetch_related(
        Prefetch('pools__user', queryset = get_user_model().objects.all().only('username')),
        'pool_specification__specifications',
    )

    _allowed_sort_keys = {
        'name': 'name',
        'format': 'format',
        'game_type': 'game_type',
        'state': 'state',
        'created_at': 'created_at',
        'playing_at': 'playing_at',
        'finished_at': 'finished_at',
        # 'pool_size': 'pool_size',
    }

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        name_filter = request.GET.get('name_filter')
        if name_filter:
            if not isinstance(name_filter, str):
                return Response(f'invalid name filter {name_filter}', status = status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(name__contains = name_filter)

        format_filter = request.GET.get('format_filter')
        if format_filter:
            try:
                game_format = Format.formats_map[format_filter]
            except KeyError:
                return Response(f'invalid format filter {format_filter}', status = status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(format = game_format.name)

        game_type_filter = request.GET.get('game_type_filter')
        if game_type_filter:
            queryset = queryset.filter(game_type=game_type_filter)

        state_filter = request.GET.get('state_filter')
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
                request.GET.get('state_filter_comparator'),
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

        # pool_size_filter = request.GET.get('pool_size_filter')
        # if pool_size_filter:
        #     try:
        #         pool_size = int(pool_size_filter)
        #     except ValueError:
        #         return Response(f'invalid pool_size filter {pool_size_filter}', status = status.HTTP_400_BAD_REQUEST)
        #     comparator = {
        #         '=': '',
        #         '!=': None,
        #         '<': '__lt',
        #         '<=': '__lte',
        #         '>': '__gt',
        #         '>=': '__gte',
        #     }.get(
        #         request.GET.get('pool_size_filter_comparator'),
        #         '',
        #     )
        #     if comparator is None:
        #         queryset = queryset.exclude(pool_size = pool_size)
        #     else:
        #         queryset = queryset.filter(
        #             **{
        #                 'pool_size' + comparator: pool_size
        #             }
        #         )
        #
        # release_filter = request.GET.get('release_filter')
        # if release_filter:
        #     try:
        #         queryset = queryset.filter(release_id = int(release_filter))
        #     except ValueError:
        #         if not isinstance(release_filter, str):
        #             return Response(f'invalid release filter {release_filter}', status = status.HTTP_400_BAD_REQUEST)
        #         queryset = queryset.filter(release__name__contains = release_filter)

        players_filter = request.GET.get('players_filter')
        if players_filter:
            if not isinstance(players_filter, str):
                return Response(f'invalid player filter {players_filter}', status = status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(pools__user__username = players_filter)

        sort_key = [self._allowed_sort_keys.get(request.GET.get('sort_key'), 'created_at')]
        ascending = strtobool(request.GET.get('ascending', 'false'))

        if sort_key[0] != self._allowed_sort_keys['created_at']:
            sort_key.append(self._allowed_sort_keys['created_at'])

        if not ascending:
            sort_key[0] = '-' + sort_key[0]

        queryset = queryset.order_by(*sort_key)

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many = True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many = True)
        return Response(serializer.data)


class SessionDetail(generics.RetrieveAPIView):
    serializer_class = serializers.FullSealedSessionSerializer
    queryset = models.LimitedSession.objects.all().prefetch_related(
        Prefetch('pools__decks', queryset = models.PoolDeck.objects.all().only('id')),
        Prefetch('pools__user', queryset = get_user_model().objects.all().only('username')),
    )