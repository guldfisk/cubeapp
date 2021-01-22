from __future__ import annotations

import itertools
import math
import random
import typing as t
from collections import defaultdict

import numpy as np

from django.db import models, transaction
from django.db.models import Count, Prefetch, QuerySet

from yeetlong.multiset import Multiset

from mtgorp.models.formats.format import LimitedSideboard
from mtgorp.models.tournaments import tournaments as to
from mtgorp.models.tournaments.matches import MatchType

from api.models import VersionedCube
from tournaments.models import Tournament, TournamentWinner, TournamentParticipant
from utils.fields import StringMapField, SerializeableField
from utils.mixins import TimestampedModel, SoftDeletionModel
from draft.models import DraftSession
from limited.models import PoolDeck, CubeBoosterSpecification


class LeagueError(Exception):
    pass


class HOFLeague(SoftDeletionModel, TimestampedModel, models.Model):
    name = models.CharField(max_length = 255)
    versioned_cube = models.ForeignKey(VersionedCube, on_delete = models.CASCADE, related_name = 'leagues')
    previous_n_releases = models.PositiveSmallIntegerField()
    season_size = models.PositiveSmallIntegerField()
    top_n_from_previous_season = models.PositiveSmallIntegerField()
    low_participation_prioritization_amount = models.PositiveSmallIntegerField()
    tournament_type: t.Type[to.Tournament] = StringMapField(to.Tournament.tournaments_map)
    tournament_config = models.JSONField()
    match_type: MatchType = SerializeableField(MatchType)

    @property
    def eligible_decks(self) -> QuerySet:
        release_ids = set(self.versioned_cube.releases.order_by('-created_at').values_list('id', flat = True)[:self.previous_n_releases])
        return PoolDeck.objects.annotate(
            specifications_count = Count(
                'tournament_entries__wins__tournament__limited_session__draft_session__pool_specification__specifications'
            ),
            winners_count = Count(
                'tournament_entries__wins__tournament__limited_session__draft_session__limited_session__tournament__results'
            ),
        ).filter(
            specifications_count = 1,
            winners_count = 1,
            tournament_entries__wins__tournament__limited_session__draft_session__isnull = False,
            tournament_entries__wins__tournament__limited_session__format = LimitedSideboard.name,
            tournament_entries__wins__tournament__limited_session__pool_specification__specifications__type = CubeBoosterSpecification._typedmodels_type,
            tournament_entries__wins__tournament__limited_session__pool_specification__specifications__release__in = release_ids,
            tournament_entries__wins__tournament__limited_session__pool_specification__specifications__allow_intersection = False,
            tournament_entries__wins__tournament__limited_session__pool_specification__specifications__allow_repeat = False,
        )

    def get_decks_for_season(self) -> t.Mapping[PoolDeck, float]:
        possible_decks = set(self.eligible_decks)

        if len(possible_decks) < self.season_size:
            raise LeagueError('Insufficient decks')

        previous_seasons: t.List[Tournament] = list(
            Tournament.objects.filter(
                season__league = self,
                state = Tournament.TournamentState.FINISHED,
            ).prefetch_related(
                'participants',
                'participants__deck',
                'rounds',
                'rounds__matches',
                'rounds__matches__seats',
                'rounds__matches__seats__participant',
                Prefetch(
                    'rounds__matches__seats__participant__deck',
                    queryset = PoolDeck.objects.all().only(
                        'id',
                        'name',
                        'created_at',
                        'pool_id',
                    )
                ),
                'rounds__matches__seats__participant__player',
                'rounds__matches__seats__result',
                'rounds__matches__result',
                'results',
                'results__participant',
                Prefetch(
                    'results__participant__deck',
                    queryset = PoolDeck.objects.all().only(
                        'id',
                        'name',
                        'created_at',
                        'pool_id',
                    )
                ),
                'results__participant__player',
            ).order_by('created_at')
        )

        if not previous_seasons:
            return {
                deck: 0.
                for deck in
                set(random.sample(list(possible_decks), self.season_size))
            }

        decks: t.Set[PoolDeck] = set()

        previous_season = previous_seasons[-1]
        for participant in previous_season.tournament.top_n(
            previous_season.completed_rounds,
            self.top_n_from_previous_season,
            strict = False,
        ):
            decks.add(participant.deck)

        possible_decks -= decks

        weight_map = defaultdict(float)
        appearances = Multiset()

        for season in previous_seasons:
            ranked_participants = season.tournament.get_ranked_players(season.completed_rounds)
            for participants, weight in zip(ranked_participants, np.linspace(1, -1, len(ranked_participants))):
                for participant in participants:
                    weight_map[participant.deck] += weight
                    appearances.add(participant.deck)

        remaining = self.low_participation_prioritization_amount

        for key, items in itertools.groupby(
            sorted(appearances.elements()[deck] for deck in possible_decks),
        ):
            items = len(list(items))
            if remaining <= 0:
                break
            if items <= remaining:
                for deck in possible_decks:
                    if appearances.elements()[deck] == key:
                        decks.add(deck)
                remaining -= items
            else:
                for deck in random.sample([deck for deck in possible_decks if appearances.elements()[deck] == key], remaining):
                    decks.add(deck)
                break

        remaining = self.season_size - len(decks)

        if remaining > 0:
            possible_decks -= decks

            possible_decks_list = list(possible_decks)

            weights = np.array(
                [
                    1 / (1 + math.e ** (-.5 * weight_map[deck]))
                    for deck in
                    possible_decks_list
                ]
            )

            for deck in np.random.choice(
                a = possible_decks_list,
                size = remaining,
                replace = False,
                p = weights / sum(weights),
            ):
                decks.add(deck)

        return {
            deck: -weight_map[deck]
            for deck in
            decks
        }

    def create_season(self) -> Season:
        decks = self.get_decks_for_season()
        with transaction.atomic():
            tournament = Tournament.objects.create(
                name = '{} - Season {}'.format(self.name, self.seasons.count() + 1),
                tournament_type = self.tournament_type,
                tournament_config = self.tournament_config,
                match_type = self.match_type,
            )

            for deck, seed in decks.items():
                TournamentParticipant.objects.create(
                    tournament = tournament,
                    deck = deck,
                    seed = seed,
                )

            tournament.advance()

            return Season.objects.create(
                league = self,
                tournament = tournament,
            )


class Season(TimestampedModel):
    league = models.ForeignKey(HOFLeague, on_delete = models.CASCADE, related_name = 'seasons')
    tournament = models.OneToOneField(Tournament, on_delete = models.CASCADE, related_name = 'season')
