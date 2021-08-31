from django.db.models import Prefetch, Count, Avg, IntegerField, Subquery, OuterRef, FloatField, Q
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.response import Response

from league import models
from league import serializers
from league.utils import prefetch_league_tournament_related, USER_QUERY_SET
from limited.models import LimitedSession
from limited.serializers import FullPoolDeckSerializer


class LeagueDetail(generics.RetrieveAPIView):
    serializer_class = serializers.LeagueSerializer
    queryset = models.HOFLeague.objects.all()


class RecentLeague(generics.RetrieveAPIView):
    serializer_class = serializers.SeasonSerializer
    queryset = models.Season.objects.order_by('created_at')

    def get_object(self):
        return self.queryset.last()


class LeagueRelatedList(generics.ListAPIView):
    queryset = models.HOFLeague.objects.all().only('id')

    def get_object(self) -> models.HOFLeague:
        queryset = self.queryset.all()

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)

        self.check_object_permissions(self.request, obj)

        return obj


class LeagueSeasons(LeagueRelatedList):
    serializer_class = serializers.MinimalSeasonSerializer

    def get_queryset(self):
        league: models.HOFLeague = self.get_object()
        return prefetch_league_tournament_related(
            models.Season.objects.filter(
                league = league,
            ).order_by(
                '-created_at',
            )
        )


class LeagueEligibles(LeagueRelatedList):
    serializer_class = FullPoolDeckSerializer

    def get_queryset(self):
        league: models.HOFLeague = self.get_object()
        return league.eligible_decks.select_related(
            'pool__user',
            'pool__session__tournament',
        ).prefetch_related(
            Prefetch(
                'pool__session',
                queryset = LimitedSession.objects.all().only(
                    'id',
                    'name',
                    'state',
                )
            ),
        ).order_by(
            '-created_at',
        )


class LeagueList(generics.ListAPIView):
    serializer_class = serializers.LeagueSerializer
    queryset = models.HOFLeague.objects.all()


class LeagueLeaderBoard(LeagueRelatedList):
    serializer_class = serializers.PoolDeckScoreSerializer

    def get_queryset(self):
        league: models.HOFLeague = self.get_object()
        return models.PoolDeck.objects.filter(
            Q(
                league_ratings__league_id = league.id,
            ) | Q(
                id__in = Subquery(
                    league.eligible_decks.values('pk'),
                )
            )
        ).annotate(
            wins = Coalesce(
                Subquery(
                    models.TournamentParticipant.objects.filter(
                        tournament__season__league = league,
                        placement = 0,
                        deck_id = OuterRef('pk'),
                    ).values('deck').annotate(cnt = Count('pk')).values('cnt'),
                    output_field = IntegerField(),
                ),
                0,
            ),
            seasons = Coalesce(
                Subquery(
                    models.TournamentParticipant.objects.filter(
                        tournament__season__league = league,
                        deck_id = OuterRef('pk'),
                    ).values('deck').annotate(cnt = Count('pk')).values('cnt'),
                    output_field = IntegerField(),
                ),
                0,
            ),
            average_placement = Subquery(
                models.TournamentParticipant.objects.filter(
                    tournament__season__league = league,
                    placement__isnull = False,
                    deck_id = OuterRef('pk')
                ).values('deck').annotate(avr = Avg('placement')).values('avr'),
                output_field = FloatField(),
            ),
            rating = Coalesce(
                Subquery(
                    models.DeckRating.objects.filter(
                        league_id = league.id,
                        deck_id = OuterRef('pk'),
                    ).values('rating'),
                    output_field = IntegerField(),
                ),
                1000,
            ),
        ).order_by('-rating', 'average_placement', '-wins').prefetch_related(
            Prefetch(
                'pool__user',
                queryset = USER_QUERY_SET,
            ),
        )


class QuickMatchDetail(generics.RetrieveAPIView):
    queryset = models.QuickMatch.objects.order_by('-created_at')
    serializer_class = serializers.QuickMatchSerializer


class QuickMatchList(LeagueRelatedList):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]
    serializer_class = serializers.QuickMatchSerializer

    def get_queryset(self):
        return prefetch_league_tournament_related(
            models.QuickMatch.objects.filter(
                league = self.get_object(),
            ).order_by(
                '-created_at',
            )
        )

    def post(self, request, *args, **kwargs):
        return Response(
            serializers.QuickMatchSerializer(
                self.get_object().create_quick_match(
                    request.user,
                    request.data.get('rated'),
                ),
            ).data,
            status = status.HTTP_201_CREATED,
        )
