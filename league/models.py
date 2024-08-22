from __future__ import annotations

import random
import typing as t
from collections import defaultdict

import numpy as np
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.db import models, transaction
from django.db.models import (
    Count,
    F,
    Func,
    IntegerField,
    OuterRef,
    Q,
    QuerySet,
    Subquery,
)
from django.db.models.functions import Coalesce
from mtgorp.models.formats.format import LimitedSideboard
from mtgorp.models.tournaments import tournaments as to
from mtgorp.models.tournaments.matches import MatchType
from mtgorp.models.tournaments.tournaments import AllMatches

from api.models import VersionedCube
from league.values import DEFAULT_RATING
from limited.models import CubeBoosterSpecification, PoolDeck
from tournaments.models import Tournament, TournamentParticipant
from utils.fields import SerializeableField, StringMapField
from utils.mixins import SoftDeletionModel, TimestampedModel


class LeagueError(Exception):
    pass


class HOFLeague(SoftDeletionModel, TimestampedModel, models.Model):
    name = models.CharField(max_length=255)
    versioned_cube = models.ForeignKey(VersionedCube, on_delete=models.CASCADE, related_name="leagues")
    previous_n_releases = models.PositiveSmallIntegerField()
    season_size = models.PositiveSmallIntegerField()
    top_n_from_previous_season = models.PositiveSmallIntegerField()
    low_participation_prioritization_amount = models.PositiveSmallIntegerField()
    tournament_type: t.Type[to.Tournament] = StringMapField(to.Tournament.tournaments_map)
    tournament_config = models.JSONField()
    match_type: MatchType = SerializeableField(MatchType)
    rating_change = models.PositiveSmallIntegerField()

    @property
    def eligible_decks(self) -> QuerySet:
        decks = PoolDeck.objects.annotate(
            specifications_count=Count(
                "tournament_entries__wins__tournament__limited_session"
                "__draft_session__pool_specification__specifications"
            ),
            winners_count=Count(
                "tournament_entries__wins__tournament__limited_session"
                "__draft_session__limited_session__tournament__results"
            ),
        ).filter(
            specifications_count=1,
            winners_count=1,
            tournament_entries__wins__tournament__limited_session__draft_session__isnull=False,
            tournament_entries__wins__tournament__limited_session__format=LimitedSideboard.name,
            tournament_entries__wins__tournament__limited_session__pool_specification__specifications__type=CubeBoosterSpecification._typedmodels_type,
            tournament_entries__wins__tournament__limited_session__pool_specification__specifications__allow_intersection=False,
            tournament_entries__wins__tournament__limited_session__pool_specification__specifications__allow_repeat=False,
        )

        if self.previous_n_releases == 0:
            decks = decks.filter(
                tournament_entries__wins__tournament__limited_session__pool_specification__specifications__release__versioned_cube_id=self.versioned_cube_id,
            )
        else:
            decks = decks.filter(
                tournament_entries__wins__tournament__limited_session__pool_specification__specifications__release__in=Subquery(
                    self.versioned_cube.releases.order_by("-created_at").values("id")[: self.previous_n_releases]
                ),
            )

        return decks

    @property
    def eligible_decks_with_presence(self) -> QuerySet:
        return self.eligible_decks.annotate(
            seasons=Coalesce(
                Subquery(
                    TournamentParticipant.objects.filter(
                        Q(tournament__season__league_id=self.id) | Q(tournament__quick_match__league_id=self.id),
                        deck_id=OuterRef("pk"),
                    )
                    .values("deck")
                    .annotate(cnt=Count("pk"))
                    .values("cnt"),
                    output_field=IntegerField(),
                ),
                0,
            ),
        )

    def get_decks_for_quick_match(self, deck: t.Optional[PoolDeck] = None) -> t.Tuple[PoolDeck, PoolDeck]:
        if deck is None:
            possible_decks_list = list(self.eligible_decks_with_presence)

            weights = np.array([1 / (1 + d.seasons**0.5) for d in possible_decks_list])

            deck = np.random.choice(
                a=possible_decks_list,
                size=1,
                replace=False,
                p=weights / sum(weights),
            )[0]

        else:
            if not self.eligible_decks.filter(id=deck.id).exists():
                raise LeagueError(f'Specified deck "{deck.name}" ({deck.id}) not in league.')

        try:
            rating = deck.league_ratings.get(league=self).rating
        except DeckRating.DoesNotExist:
            rating = DEFAULT_RATING

        return (
            deck,
            self.eligible_decks_with_presence.filter(
                league_ratings__league=self,
            )
            .exclude(
                id=deck.id,
            )
            .annotate(
                rating_difference=Func(
                    F("league_ratings__rating") - rating,
                    function="ABS",
                )
            )
            .order_by("rating_difference", "seasons", "-pool__session__created_at")
            .first(),
        )

    def get_decks_for_season(self) -> t.Mapping[PoolDeck, float]:
        all_decks = self.eligible_decks_with_presence

        possible_decks = set(all_decks)

        if len(possible_decks) < self.season_size:
            raise LeagueError("Insufficient decks")

        previous_season = Tournament.objects.filter(
            season__league_id=self.id,
            state=Tournament.TournamentState.FINISHED,
        ).last()

        if previous_season is None:
            return {deck: 0.0 for deck in set(random.sample(list(possible_decks), self.season_size))}

        decks: t.Set[PoolDeck] = set()

        for participant in previous_season.tournament.top_n(
            previous_season.completed_rounds,
            self.top_n_from_previous_season,
            strict=False,
        ):
            decks.add(participant.deck)

        possible_decks -= decks

        deck_season_map = defaultdict(list)

        for deck in possible_decks:
            deck_season_map[deck.seasons].append(deck)

        remaining = self.low_participation_prioritization_amount

        for _, _decks in sorted(deck_season_map.items(), key=lambda p: p[0]):
            if len(_decks) >= remaining:
                for deck in random.sample(_decks, remaining):
                    decks.add(deck)
                break
            else:
                for deck in _decks:
                    decks.add(deck)
                remaining -= len(_decks)

        remaining = self.season_size - len(decks)

        ratings_map = {
            d.deck_id: d.rating
            for d in DeckRating.objects.filter(
                league=self,
                deck__in=all_decks,
            )
        }

        if remaining > 0:
            possible_decks -= decks
            possible_decks_list = list(possible_decks)

            weights = np.array(
                [ratings_map.get(d.id, DEFAULT_RATING) ** 5 / (d.seasons + 1) ** 0.5 for d in possible_decks_list]
            )

            for deck in np.random.choice(
                a=possible_decks_list,
                size=remaining,
                replace=False,
                p=weights / sum(weights),
            ):
                decks.add(deck)

        return {
            deck: idx
            for idx, deck in enumerate(
                sorted(
                    decks,
                    key=lambda d: ratings_map.get(d.id, DEFAULT_RATING),
                    reverse=True,
                )
            )
        }

    def create_quick_match(self, user: AbstractUser, rated: bool, decks: t.Sequence[PoolDeck] = ()) -> QuickMatch:
        if len(decks) > 2:
            raise LeagueError("Quick Match must not have more than 2 participants.")
        if decks and len(decks) != self.eligible_decks.filter(id__in=[d.id for d in decks]).count():
            raise LeagueError("Invalid decks for Quick Match")
        if len(decks) == 0:
            decks = self.get_decks_for_quick_match()
        elif len(decks) == 1:
            decks = self.get_decks_for_quick_match(decks[0])

        with transaction.atomic():
            tournament = Tournament.objects.create(
                name="{} - Quick match {}".format(self.name, self.quick_matches.count() + 1),
                tournament_type=AllMatches,
                tournament_config={},
                match_type=self.match_type,
            )

            for deck in decks:
                TournamentParticipant.objects.create(
                    tournament=tournament,
                    deck=deck,
                )

            tournament.advance()

            return QuickMatch.objects.create(
                league=self,
                tournament=tournament,
                rated=rated,
                created_by=user,
            )

    def create_season(self) -> Season:
        decks = self.get_decks_for_season()
        with transaction.atomic():
            tournament = Tournament.objects.create(
                name="{} - Season {}".format(self.name, self.seasons.count() + 1),
                tournament_type=self.tournament_type,
                tournament_config=self.tournament_config,
                match_type=self.match_type,
            )

            for deck, seed in decks.items():
                TournamentParticipant.objects.create(
                    tournament=tournament,
                    deck=deck,
                    seed=seed,
                )

            tournament.advance()

            return Season.objects.create(
                league=self,
                tournament=tournament,
            )

    def get_absolute_url(self) -> str:
        return f"/leagues/{self.id}"


class Season(TimestampedModel):
    league = models.ForeignKey(HOFLeague, on_delete=models.CASCADE, related_name="seasons")
    tournament = models.OneToOneField(Tournament, on_delete=models.CASCADE, related_name="season")
    ratings_processed = models.BooleanField(default=False)

    def get_absolute_url(self) -> str:
        return f"/tournaments/{self.tournament_id}"


class QuickMatch(TimestampedModel):
    league = models.ForeignKey(HOFLeague, on_delete=models.CASCADE, related_name="quick_matches")
    tournament = models.OneToOneField(Tournament, on_delete=models.CASCADE, related_name="quick_match")
    ratings_processed = models.BooleanField(default=False)
    rated = models.BooleanField()
    created_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name="created_quick_matches")


class DeckRating(models.Model):
    league = models.ForeignKey(HOFLeague, on_delete=models.CASCADE, related_name="ratings")
    deck = models.ForeignKey(PoolDeck, on_delete=models.CASCADE, related_name="league_ratings")
    rating = models.IntegerField()

    @property
    def elo(self) -> int:
        return self.rating

    @elo.setter
    def elo(self, value: int) -> None:
        self.rating = value
