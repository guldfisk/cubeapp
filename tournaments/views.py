from distutils.util import strtobool

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Prefetch
from mtgorp.models.tournaments import tournaments as to
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.request import Request
from rest_framework.response import Response

from limited.models import PoolDeck
from tournaments import models, serializers


USER_QUERY_SET = get_user_model().objects.all().only("id", "username")


class ScheduledMatchView(generics.GenericAPIView):
    queryset = models.ScheduledMatch.objects.all().prefetch_related(
        "seats",
        "seats__participant",
        Prefetch(
            "seats__participant__player",
            queryset=USER_QUERY_SET,
        ),
        Prefetch(
            "seats__participant__deck",
            queryset=PoolDeck.objects.all().only(
                "id",
                "name",
                "created_at",
                "pool_id",
            ),
        ),
        Prefetch(
            "seats__participant__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
        "result",
        "seats__result",
        "round__tournament__participants",
        Prefetch(
            "round__tournament__participants__deck",
            queryset=PoolDeck.objects.all().only(
                "id",
                "name",
                "created_at",
                "pool_id",
            ),
        ),
        Prefetch(
            "round__tournament__participants__player",
            queryset=USER_QUERY_SET,
        ),
        "round__tournament__participants__deck__pool",
        Prefetch(
            "round__tournament__participants__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
        "round__tournament__results",
        "round__tournament__results__participant",
        Prefetch(
            "round__tournament__results__participant__player",
            queryset=USER_QUERY_SET,
        ),
        "round__tournament__results__participant__deck",
        "round__tournament__results__participant__deck__pool",
        Prefetch(
            "round__tournament__results__participant__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
    )
    serializer_class = serializers.FullScheduledMatchSerializer


class ScheduledMatchDetail(generics.RetrieveAPIView, ScheduledMatchView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request: Request, *args, **kwargs) -> Response:
        scheduled_match: models.ScheduledMatch = self.get_object()

        participating_players = {
            seat.participant.player
            for seat in scheduled_match.seats.prefetch_related("participant__player")
            if seat.participant.player is not None
        }

        if participating_players and request.user not in participating_players:
            return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

        if scheduled_match.round.tournament.state != models.Tournament.TournamentState.ONGOING:
            return Response(
                {"errors": ["tournament in invalid state for submitting"]}, status=status.HTTP_400_BAD_REQUEST
            )

        if not models.ScheduledMatch.objects.filter(
            round=scheduled_match.round,
            result__isnull=True,
        ).exists():
            return Response({"errors": ["round already completed"]}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.ResultSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tournament = scheduled_match.round.tournament

        completed_match = serializer.as_completed_match

        valid, errors = tournament.match_type.validate_result(completed_match)

        if not valid:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        if not set(completed_match.results.keys()) == {seat.id for seat in scheduled_match.seats.all()}:
            return Response({"errors": ["invalid seats"]}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            models.MatchResult.objects.filter(scheduled_match=scheduled_match).delete()
            models.SeatResult.objects.filter(scheduled_seat__match=scheduled_match).delete()

            models.MatchResult.objects.create(
                draws=completed_match.draws,
                scheduled_match=scheduled_match,
            )
            for participant_id, wins in completed_match.results.items():
                models.SeatResult.objects.create(
                    scheduled_seat=models.ScheduledSeat.objects.get(pk=participant_id),
                    wins=wins,
                )

        scheduled_match.round.tournament.advance()

        return Response(self.get_serializer(scheduled_match).data, status=status.HTTP_201_CREATED)


class UserScheduledMatches(generics.ListAPIView, ScheduledMatchView):
    def get_queryset(self):
        return self.queryset.filter(
            result__isnull=True,
            seats__participant__player_id=self.kwargs["pk"],
            round__tournament__state=models.Tournament.TournamentState.ONGOING,
        ).order_by("-round__tournament__created_at")


class TournamentView(generics.GenericAPIView):
    queryset = models.Tournament.objects.all().prefetch_related(
        "participants",
        Prefetch(
            "participants__deck",
            queryset=PoolDeck.objects.all().only(
                "id",
                "name",
                "created_at",
                "pool_id",
            ),
        ),
        Prefetch(
            "participants__player",
            queryset=USER_QUERY_SET,
        ),
        "participants__deck__pool",
        Prefetch(
            "participants__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
        "rounds",
        "rounds__matches",
        "rounds__matches__seats",
        "rounds__matches__seats__participant",
        Prefetch(
            "rounds__matches__seats__participant__player",
            queryset=USER_QUERY_SET,
        ),
        Prefetch(
            "rounds__matches__seats__participant__deck",
            queryset=PoolDeck.objects.all().only(
                "id",
                "name",
                "created_at",
                "pool_id",
            ),
        ),
        Prefetch(
            "rounds__matches__seats__participant__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
        "rounds__matches__seats__result",
        "rounds__matches__result",
        "results",
        "results__participant",
        Prefetch(
            "results__participant__player",
            queryset=USER_QUERY_SET,
        ),
        "results__participant__deck",
        "results__participant__deck__pool",
        Prefetch(
            "results__participant__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
    )


class TournamentDetail(generics.RetrieveAPIView, TournamentView):
    serializer_class = serializers.TournamentSerializer


class TournamentCancel(generics.GenericAPIView):
    queryset = models.Tournament.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.TournamentSerializer

    def post(self, request: Request, *args, **kwargs) -> Response:
        tournament: models.Tournament = self.get_object()

        participating_players = {
            participant.player
            for participant in tournament.participants.prefetch_related("player").filter(player__isnull=False)
        }

        if participating_players and request.user not in participating_players:
            return Response(status=status.HTTP_403_FORBIDDEN)

        if not tournament.state.ONGOING:
            return Response({"errors": ["invalid state for canceling"]}, status=status.HTTP_400_BAD_REQUEST)

        return Response(self.get_serializer(tournament.cancel()).data)


class TournamentList(generics.ListAPIView, TournamentView):
    serializer_class = serializers.TournamentSerializer

    _allowed_sort_keys = {
        "name": "name",
        "format": "format",
        "tournament_type": "tournament_type",
        "state": "state",
        "created_at": "created_at",
        "finished_at": "finished_at",
    }

    def get_queryset(self):
        queryset = self.queryset.all()

        name_filter = self.request.GET.get("name_filter")
        if name_filter:
            if not isinstance(name_filter, str):
                return Response(f"invalid name filter {name_filter}", status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(name__contains=name_filter)

        tournament_type_filter = self.request.GET.get("tournament_type_filter")
        if tournament_type_filter:
            try:
                tournament_type = to.Tournament.tournaments_map[tournament_type_filter]
            except KeyError:
                return Response(
                    f"invalid tournament type filter {tournament_type_filter}", status=status.HTTP_400_BAD_REQUEST
                )
            queryset = queryset.filter(tournament_type=tournament_type)

        state_filter = self.request.GET.getlist("state_filter")
        if state_filter:
            try:
                if isinstance(state_filter, list):
                    states = [models.Tournament.TournamentState[_state] for _state in state_filter]
                else:
                    states = [models.Tournament.TournamentState[state_filter]]
            except KeyError:
                return Response(f"invalid state filter {state_filter}", status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(**{"state__in": states})

        players_filter = self.request.GET.get("players_filter")
        if players_filter:
            if not isinstance(players_filter, str):
                return Response(f"invalid player filter {players_filter}", status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(participants__player__username=players_filter)

        sort_key = [self._allowed_sort_keys.get(self.request.GET.get("sort_key"), "created_at")]
        ascending = strtobool(self.request.GET.get("ascending", "false"))

        if sort_key[0] != self._allowed_sort_keys["created_at"]:
            sort_key.append(self._allowed_sort_keys["created_at"])

        if not ascending:
            sort_key[0] = "-" + sort_key[0]

        return queryset.order_by(*sort_key)
