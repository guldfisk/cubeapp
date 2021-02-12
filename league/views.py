from django.contrib.auth import get_user_model
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404

from rest_framework import generics

from league import models
from league import serializers
from limited.models import LimitedSession, PoolDeck
from limited.serializers import FullPoolDeckSerializer


USER_QUERY_SET = get_user_model().objects.all().only('id', 'username')


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

    def get_object(self):
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
        return models.Season.objects.filter(
            league = league,
        ).order_by(
            '-created_at',
        ).prefetch_related(
            'tournament__participants',
            Prefetch(
                'tournament__participants__deck',
                queryset = PoolDeck.objects.all().only(
                    'id',
                    'name',
                    'created_at',
                    'pool_id',
                )
            ),
            Prefetch(
                'tournament__participants__player',
                queryset = USER_QUERY_SET,
            ),
            'tournament__participants__deck__pool',
            Prefetch(
                'tournament__participants__deck__pool__user',
                queryset = USER_QUERY_SET,
            ),
            'tournament__rounds',
            'tournament__rounds__matches',
            'tournament__rounds__matches__seats',
            'tournament__rounds__matches__seats__participant',
            Prefetch(
                'tournament__rounds__matches__seats__participant__player',
                queryset = USER_QUERY_SET,
            ),
            Prefetch(
                'tournament__rounds__matches__seats__participant__deck',
                queryset = PoolDeck.objects.all().only(
                    'id',
                    'name',
                    'created_at',
                    'pool_id',
                )
            ),
            Prefetch(
                'tournament__rounds__matches__seats__participant__deck__pool__user',
                queryset = USER_QUERY_SET,
            ),
            'tournament__rounds__matches__seats__result',
            'tournament__rounds__matches__result',
            'tournament__results',
            'tournament__results__participant',
            Prefetch(
                'tournament__results__participant__player',
                queryset = USER_QUERY_SET,
            ),
            'tournament__results__participant__deck',
            'tournament__results__participant__deck__pool',
            Prefetch(
                'tournament__results__participant__deck__pool__user',
                queryset = USER_QUERY_SET,
            ),
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
