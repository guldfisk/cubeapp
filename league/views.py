from django.db.models import Prefetch
from django.shortcuts import get_object_or_404

from rest_framework import generics

from league import models
from league import serializers
from limited.models import LimitedSession
from limited.serializers import FullPoolDeckSerializer


class LeagueDetail(generics.RetrieveAPIView):
    serializer_class = serializers.LeagueSerializer
    queryset = models.HOFLeague.objects.all()


class LeagueEligibles(generics.ListAPIView):
    queryset = models.HOFLeague.objects.all()
    serializer_class = FullPoolDeckSerializer

    def get_object(self):
        queryset = self.queryset.all()

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)

        self.check_object_permissions(self.request, obj)

        return obj

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
