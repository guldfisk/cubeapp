import datetime
import io
import itertools
import random
import typing as t
from distutils.util import strtobool
from json import JSONDecodeError

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Prefetch, Q
from django.http import StreamingHttpResponse
from magiccube.collections.cube import Cube
from magiccube.tools.subset import check_deck_subset_pool
from mtgorp.models.collections.deck import Deck
from mtgorp.models.formats.format import Format
from mtgorp.models.serilization.serializeable import SerializationException
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.serilization.strategies.raw import RawStrategy
from mtgorp.tools.deckio import DeckSerializer
from mtgorp.tools.parsing.exceptions import ParseException
from proxypdf.streamwriter import StreamProxyWriter
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotAuthenticated, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from api.models import RelatedPrinting
from api.serialization import orpserialize
from limited import models
from limited.search.parse import SearchParser, SearchPatternParseException
from limited.serializers import FullLimitedSessionSerializer, LimitedSessionSerializer
from limited.serializers.pooldecks.full import (
    FullPoolDeckSerializer,
    PoolDeckSerializer,
)
from limited.serializers.pools.full import FullPoolSerializer, PoolSerializer
from resources.staticdb import db
from resources.staticimageloader import image_loader
from tournaments.models import SeatResult, TournamentParticipant


class PoolDetailPermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request: Request, view, obj: models.Pool):
        return obj.can_view(request.user)


class PoolDetailPermissionsWithCode(PoolDetailPermissions):
    def has_object_permission(self, request: Request, view, obj: models.Pool):
        code = request.query_params.get("code")
        return models.PoolSharingCode.objects.filter(code=code, pool=obj).exists() or super().has_object_permission(
            request, view, obj
        )


class DeckPermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.PoolDeck):
        return obj.can_view(request.user)


class DeckPermissionsWithCode(DeckPermissions):
    def has_object_permission(self, request: Request, view, obj: models.PoolDeck):
        code = request.query_params.get("code")
        return models.PoolSharingCode.objects.filter(
            code=code, pool_id=obj.pool_id
        ).exists() or super().has_object_permission(request, view, obj)


class PoolDetail(generics.RetrieveDestroyAPIView):
    queryset = (
        models.Pool.objects.all()
        .select_related(
            "user",
        )
        .prefetch_related(
            "pool_decks",
        )
    )
    permission_classes = [PoolDetailPermissionsWithCode]

    def get_serializer(self, *args, **kwargs):
        pool: models.Pool = args[0]
        serializer_class = (
            FullPoolSerializer
            if pool.pool_decks.exists()
            and (
                "code" in self.request.query_params
                and models.PoolSharingCode.objects.filter(
                    code=self.request.query_params["code"],
                    pool=pool,
                ).exists()
                or pool.pool_decks.order_by("created_at").last().can_view(self.request.user)
            )
            else PoolSerializer
        )
        kwargs["context"] = self.get_serializer_context()
        return serializer_class(*args, **kwargs)

    def post(self, request: Request, *args, **kwargs) -> Response:
        try:
            pool = models.Pool.objects.select_related("session").get(id=kwargs["pk"], user=request.user)
        except models.Pool.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        allow_cheating = (
            pool.session.allow_cheating
            and not SeatResult.objects.filter(
                scheduled_seat__match__round__tournament__limited_session=pool.session,
                scheduled_seat__participant__player=request.user,
            ).exists()
        )

        if not (
            (
                pool.session.state == models.LimitedSession.LimitedSessionState.DECK_BUILDING
                or (pool.session.state == models.LimitedSession.LimitedSessionState.PLAYING and allow_cheating)
            )
            and (allow_cheating or not pool.session.open_decks or not pool.pool_decks.exists())
        ):
            return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

        try:
            deck = JsonId(db).deserialize(Deck, request.data.get("deck", "{}"))
        except (SerializationException, JSONDecodeError):
            return Response({"errors": ["invalid decks definition"]}, status=status.HTTP_400_BAD_REQUEST)

        valid, errors = check_deck_subset_pool(
            pool.pool,
            deck.seventy_five,
            pool.session.infinites.cardboards,
            strict=False,
        )

        if not valid:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        game_format = Format.formats_map.get(pool.session.format)

        if game_format is not None:
            valid, errors = game_format.deckcheck(deck)
            if not valid:
                return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            pool.pool_decks.update(latest=False)

            cheating = (
                pool.session.state != models.LimitedSession.LimitedSessionState.DECK_BUILDING
                or pool.session.open_decks
                and pool.pool_decks.exists()
            )

            with transaction.atomic():
                pool_deck = models.PoolDeck.objects.create(
                    deck=deck,
                    pool=pool,
                    name=request.data.get("name", "decks"),
                    cheating=cheating,
                )

                RelatedPrinting.objects.bulk_create(
                    RelatedPrinting(
                        printing_id=p.id,
                        related=pool_deck,
                    )
                    for p in deck.seventy_five.distinct_elements()
                )

                if pool.session.state == models.LimitedSession.LimitedSessionState.DECK_BUILDING and all(
                    models.Pool.objects.filter(session=pool.session).values_list("pool_decks", flat=True)
                ):
                    pool.session.create_tournament()
                    pool.session.state = models.LimitedSession.LimitedSessionState.PLAYING
                    pool.session.playing_at = datetime.datetime.now()
                    pool.session.save(update_fields=("state", "playing_at"))

                elif pool.session.tournament and cheating:
                    TournamentParticipant.objects.filter(
                        tournament=pool.session.tournament,
                        player=request.user,
                    ).update(deck_id=pool_deck.id)

        return Response(
            PoolDeckSerializer(pool_deck, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PoolExport(generics.GenericAPIView):
    queryset = models.Pool.objects.all()
    permission_classes = [PoolDetailPermissionsWithCode]

    def get(self, request: Request, *args, **kwargs) -> Response:
        return Response(
            status=status.HTTP_200_OK,
            content_type="application/text",
            data=JsonId.serialize(self.get_object().pool),
        )


class DeckDetail(generics.RetrieveAPIView):
    queryset = models.PoolDeck.objects.all().annotate_records().select_related("pool", "pool__session")
    serializer_class = FullPoolDeckSerializer
    permission_classes = [DeckPermissionsWithCode]


class DeckList(generics.ListAPIView):
    queryset = (
        models.PoolDeck.objects.filter(
            Q(pool__session__state=models.LimitedSession.LimitedSessionState.FINISHED)
            | Q(
                pool__session__state=models.LimitedSession.LimitedSessionState.PLAYING,
                pool__session__open_decks=True,
            ),
            latest=True,
        )
        .annotate_records()
        .select_related(
            "pool__user",
            "pool__session__tournament",
        )
        .prefetch_related(
            Prefetch(
                "pool__session",
                queryset=models.LimitedSession.objects.all().only(
                    "id",
                    "name",
                    "state",
                ),
            ),
        )
        .order_by(
            "-created_at",
        )
    )
    serializer_class = FullPoolDeckSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        filter_query = self.request.GET.get("filter")
        explanation = ""
        if filter_query:
            try:
                search = SearchParser(db).parse(filter_query)
            except (SearchPatternParseException, ParseException) as e:
                raise ValidationError(e)

            queryset = search.freeze(db).filter(queryset)
            explanation = search.node.explain()

        page = self.paginate_queryset(queryset)
        response = self.get_paginated_response(self.get_serializer(page, many=True).data)
        response.data["query_explained"] = explanation

        return response


class DeckExport(generics.GenericAPIView):
    queryset = models.PoolDeck.objects.all()
    permission_classes = [DeckPermissionsWithCode]

    @classmethod
    def generate_pdf(cls, deck: models.PoolDeck) -> t.Iterator[bytes]:
        with io.BytesIO() as f:
            with StreamProxyWriter(
                f,
                margin_size=0.5,
                close_stream=False,
            ) as writer:
                for printing, multiplicity in itertools.chain(
                    *(
                        sorted(pair, key=lambda v: (v[0].cardboard.name, v[0].expansion.code))
                        for pair in (deck.deck.maindeck.items(), deck.deck.sideboard.items())
                    )
                ):
                    writer.add_proxy(image_loader.get_image(printing).get(), multiplicity)
                    f.seek(0)
                    yield f.read()
                    f.truncate(0)
                    f.seek(0)
            f.seek(0)
            yield f.read()
            f.truncate(0)
            f.seek(0)

    def get(self, request: Request, *args, **kwargs):
        export_type = request.query_params.get("extension", "dec")
        if export_type == "pdf":
            if not self.request.user.is_authenticated:
                raise NotAuthenticated()
            return StreamingHttpResponse(self.generate_pdf(self.get_object()))
        try:
            serializer_type = DeckSerializer.extension_to_serializer[export_type]
        except KeyError:
            return Response(
                data="Invalid extension",
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            status=status.HTTP_200_OK,
            content_type="application/octet-stream",
            data=serializer_type(db).serialize(self.get_object().deck),
        )


class SampleHand(generics.GenericAPIView):
    queryset = models.PoolDeck.objects.all()
    permission_classes = [DeckPermissionsWithCode]

    def get(self, request: Request, *args, **kwargs) -> Response:
        try:
            native = strtobool(self.request.query_params.get("native", "False"))
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        return Response(
            status=status.HTTP_200_OK,
            data=(RawStrategy if native else orpserialize.CubeSerializer).serialize(
                Cube(
                    random.sample(
                        list(self.get_object().deck.maindeck),
                        7,
                    )
                )
            ),
        )


class SharePool(generics.GenericAPIView):
    queryset = models.Pool.objects.all()
    permission_classes = [PoolDetailPermissionsWithCode]

    def post(self, request: Request, *args, **kwargs) -> Response:
        return Response(
            status=status.HTTP_200_OK,
            data={
                "code": models.PoolSharingCode.get_for_pool(self.get_object()).code,
            },
        )


class SessionList(generics.ListAPIView):
    serializer_class = LimitedSessionSerializer

    _allowed_sort_keys = {
        "name": "name",
        "format": "format",
        "game_type": "game_type",
        "state": "state",
        "created_at": "created_at",
        "playing_at": "playing_at",
        "finished_at": "finished_at",
    }

    def get_queryset(self):
        queryset = models.LimitedSession.objects.all().prefetch_related(
            "pool_specification__specifications",
            Prefetch(
                "pool_specification__specifications__release",
                queryset=models.CubeRelease.objects.all().only(
                    "id",
                    "name",
                    "created_at",
                    "checksum",
                    "intended_size",
                    "versioned_cube_id",
                ),
            ),
            Prefetch(
                "pools",
                queryset=models.Pool.objects.all().only(
                    "id",
                    "session_id",
                    "user_id",
                ),
            ),
            "pools__user",
        )
        name_filter = self.request.GET.get("name_filter")
        if name_filter:
            if not isinstance(name_filter, str):
                return Response(f"invalid name filter {name_filter}", status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(name__contains=name_filter)

        format_filter = self.request.GET.get("format_filter")
        if format_filter:
            try:
                game_format = Format.formats_map[format_filter]
            except KeyError:
                return Response(f"invalid format filter {format_filter}", status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(format=game_format.name)

        game_type_filter = self.request.GET.get("game_type_filter")
        if game_type_filter:
            queryset = queryset.filter(game_type=game_type_filter)

        state_filter = self.request.GET.getlist("state_filter")
        if state_filter:
            try:
                if isinstance(state_filter, list):
                    states = [models.LimitedSession.LimitedSessionState[_state] for _state in state_filter]
                else:
                    states = [models.LimitedSession.LimitedSessionState[state_filter]]
            except KeyError:
                return Response(f"invalid state filter {state_filter}", status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(**{"state__in": states})

        players_filter = self.request.GET.get("players_filter")
        if players_filter:
            if not isinstance(players_filter, str):
                return Response(f"invalid player filter {players_filter}", status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(pools__user__username=players_filter)

        sort_key = [self._allowed_sort_keys.get(self.request.GET.get("sort_key"), "created_at")]
        ascending = strtobool(self.request.GET.get("ascending", "false"))

        if sort_key[0] != self._allowed_sort_keys["created_at"]:
            sort_key.append(self._allowed_sort_keys["created_at"])

        if not ascending:
            sort_key[0] = "-" + sort_key[0]

        return queryset.order_by(*sort_key)


class SessionDetail(generics.RetrieveDestroyAPIView):
    serializer_class = FullLimitedSessionSerializer
    queryset = models.LimitedSession.objects.all().prefetch_related(
        Prefetch("pools__pool_decks", queryset=models.PoolDeck.objects.all().only("id")),
        Prefetch("pools__user", queryset=get_user_model().objects.all().only("username")),
    )
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class SessionResultsPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj: models.LimitedSession):
        return obj.pools.filter(user_id=request.user.id).exists()


class CompleteSession(generics.GenericAPIView):
    queryset = models.LimitedSession.objects.all()
    permission_classes = [
        SessionResultsPermission,
    ]

    def post(self, request: Request, *args, **kwargs) -> Response:
        session: models.LimitedSession = self.get_object()
        if not session.state == models.LimitedSession.LimitedSessionState.PLAYING:
            return Response(
                "Cannot complete limited session that is not playing",
                status=status.HTTP_400_BAD_REQUEST,
            )
        session.complete()
        return Response(status=status.HTTP_200_OK)
