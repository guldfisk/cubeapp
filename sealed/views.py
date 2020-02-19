import datetime
import json
from distutils.util import strtobool
from json import JSONDecodeError

from django.db import transaction
from django.db.models import Prefetch, Count
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import BasePermission, SAFE_METHODS

from magiccube.tools.subset import check_deck_subset_pool
from mtgorp.models.serilization.strategies.raw import RawStrategy

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from api.models import CubeRelease
from mtgorp.models.collections.deck import Deck
from mtgorp.models.serilization.serializeable import SerializationException
from mtgorp.models.serilization.strategies.jsonid import JsonId
from resources.staticdb import db

from sealed import models, serializers
from sealed.formats import Format


class PoolDetailPermissions(permissions.BasePermission):

    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.Pool):
        return (
            obj.session.state.value > models.SealedSession.SealedSessionState.DECK_BUILDING.value
            or request.user == obj.user
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
        print(request, request.data, request.POST)

        try:
            pool = models.Pool.objects.select_related('session').get(id = kwargs['pk'], user = request.user)
        except models.Pool.DoesNotExist:
            return Response(status = status.HTTP_404_NOT_FOUND)

        if not pool.session.state == models.SealedSession.SealedSessionState.DECK_BUILDING:
            return Response(status = status.HTTP_405_METHOD_NOT_ALLOWED)

        try:
            deck = JsonId(db).deserialize(Deck, request.data.get('deck', '{}'))
        except (SerializationException, JSONDecodeError):
            return Response({'errors': ['invalid deck definition']}, status = status.HTTP_400_BAD_REQUEST)

        valid, error = check_deck_subset_pool(
            pool.session.release.cube,
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
                pool.session.state = models.SealedSession.SealedSessionState.PLAYING
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


# class PoolList(generics.ListAPIView):
#     permission_classes = [permissions.IsAuthenticated]
#     serializer_class = serializers.MinimalPoolSerializer
#
#     def get_queryset(self):
#         return models.Pool.objects.filter(
#             user = self.request.user,
#         ).select_related(
#             'session',
#         ).prefetch_related(
#             Prefetch('session__release', queryset = CubeRelease.objects.all().only('name')),
#             Prefetch('session__pools__user', queryset = get_user_model().objects.all().only('username')),
#             Prefetch('decks', queryset = models.PoolDeck.objects.all().order_by('-created_at').only('id')),
#         ).order_by('-session__created_at')


class SessionList(generics.ListAPIView):
    serializer_class = serializers.SealedSessionSerializer
    queryset = models.SealedSession.objects.all().prefetch_related(
        Prefetch('pools__user', queryset = get_user_model().objects.all().only('username')),
        Prefetch('release', queryset = CubeRelease.objects.all().only('name')),
    )

    _allowed_sort_keys = {
        'name': 'name',
        'format': 'format',
        'state': 'state',
        'created_at': 'created_at',
        'playing_at': 'playing_at',
        'finished_at': 'finished_at',
        'pool_size': 'pool_size',
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

        state_filter = request.GET.get('state_filter')
        if state_filter:
            try:
                state = models.SealedSession.SealedSessionState[state_filter]
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

        pool_size_filter = request.GET.get('pool_size_filter')
        if pool_size_filter:
            try:
                pool_size = int(pool_size_filter)
            except ValueError:
                return Response(f'invalid pool_size filter {pool_size_filter}', status = status.HTTP_400_BAD_REQUEST)
            comparator = {
                '=': '',
                '!=': None,
                '<': '__lt',
                '<=': '__lte',
                '>': '__gt',
                '>=': '__gte',
            }.get(
                request.GET.get('pool_size_filter_comparator'),
                '',
            )
            if comparator is None:
                queryset = queryset.exclude(pool_size = pool_size)
            else:
                queryset = queryset.filter(
                    **{
                        'pool_size' + comparator: pool_size
                    }
                )

        release_filter = request.GET.get('release_filter')
        if release_filter:
            try:
                queryset = queryset.filter(release_id = int(release_filter))
            except ValueError:
                if not isinstance(release_filter, str):
                    return Response(f'invalid release filter {release_filter}', status = status.HTTP_400_BAD_REQUEST)
                queryset = queryset.filter(release__name__contains = release_filter)

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


# class SessionDetailPermissions(BasePermission):
#
#     def has_permission(self, request, view):
#         return True
#
#     def has_object_permission(self, request, view, obj: models.SealedSession):
#         return (
#             obj.state.value > models.SealedSession.SealedSessionState.DECK_BUILDING.value
#             or request.user in (pool.user for pool in obj.pools.all())
#         )


class SessionDetail(generics.RetrieveAPIView):
    serializer_class = serializers.FullSealedSessionSerializer
    queryset = models.SealedSession.objects.all().prefetch_related(
        Prefetch('pools__decks', queryset = models.PoolDeck.objects.all().only('id')),
        Prefetch('pools__user', queryset = get_user_model().objects.all().only('username')),
    )
    # permission_classes = [SessionDetailPermissions]
