import json
from json import JSONDecodeError

from django.db import transaction
from django.db.models import Prefetch, Count
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import BasePermission

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


class PoolDetailPermissions(BasePermission):

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
        # Prefetch('decks', queryset = models.PoolDeck.objects.all().order_by('-created_at').only('id')),
    )
    serializer_class = serializers.PoolSerializer
    permission_classes = [PoolDetailPermissions, ]

    def post(self, request: Request, *args, **kwargs) -> Response:
        try:
            pool = models.Pool.objects.select_related('session').get(key = kwargs['key'], user = request.user)
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
            deck = models.PoolDeck.objects.create(
                deck = deck,
                pool = pool,
                name = request.data.get('name', 'deck'),
            )

            if all(models.Pool.objects.filter(session = pool.session).values_list(Count('decks'), flat = True)):
                pool.session.state = models.SealedSession.SealedSessionState.PLAYING
                pool.session.save(update_fields = ('state',))

        return Response(
            serializers.PoolDeckSerializer(deck).data,
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
    ).order_by('-created_at')


class SessionDetailPermissions(BasePermission):

    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.SealedSession):
        return (
            obj.state.value > models.SealedSession.SealedSessionState.DECK_BUILDING.value
            or request.user in (pool.user for pool in obj.pools.all())
        )


class SessionDetail(generics.RetrieveAPIView):
    serializer_class = serializers.FullSealedSessionSerializer
    queryset = models.SealedSession.objects.all().prefetch_related(
        Prefetch('pools__decks', queryset = models.PoolDeck.objects.all().only('id')),
        Prefetch('pools__user', queryset = get_user_model().objects.all().only('username')),
    )
    permission_classes = [SessionDetailPermissions]
