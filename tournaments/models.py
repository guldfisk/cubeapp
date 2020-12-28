from __future__ import annotations

import datetime
import typing as t
from enum import Enum

from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.db.models import Max

from mtgorp.models.tournaments.matches import MatchType
from mtgorp.models.tournaments import tournaments as to

from utils.fields import EnumField, StringMapField, SerializeableField
from utils.methods import get_random_name
from utils.mixins import TimestampedModel


class Tournament(TimestampedModel):
    class TournamentState(Enum):
        ONGOING = 0
        FINISHED = 1
        CANCELED = 2

    name = models.CharField(max_length = 255, default = get_random_name)
    state = EnumField(TournamentState, default = TournamentState.ONGOING)
    tournament_type: t.Type[to.Tournament] = StringMapField(to.Tournament.tournaments_map)
    tournament_config = models.JSONField()
    match_type: MatchType = SerializeableField(MatchType)
    finished_at = models.DateTimeField(null = True)

    @property
    def tournament(self) -> to.Tournament[TournamentParticipant]:
        if not hasattr(self, '_tournament'):
            players = frozenset(
                # self.participants.select_related('deck', 'player').all()
                self.participants.all()
            )
            self._tournament = self.tournament_type(
                players,
                seed_map = {
                    p: p.seed
                    for p in
                    players
                },
                **self.tournament_config,
            )
        return self._tournament

    @property
    def completed_rounds(self) -> t.Sequence[to.CompletedRound[TournamentParticipant]]:
        return [
            _round.completed_round
            for _round in
            self.rounds.prefetch_related('matches', 'matches__seats').order_by('index')
        ]

    def next_round(self) -> t.Optional[to.Round[TournamentParticipant]]:
        return self.tournament.get_round(self.completed_rounds)

    def schedule_next_round(self) -> t.Optional[TournamentRound]:
        _round = self.next_round()
        if not _round:
            return None
        with transaction.atomic():
            previous_max = self.rounds.aggregate(Max('index'))['index__max']
            scheduled_round = TournamentRound.objects.create(
                tournament = self,
                index = 0 if previous_max is None else previous_max + 1,
            )
            for _match in _round.matches:
                scheduled_match = ScheduledMatch.objects.create(
                    round = scheduled_round
                )
                for player in _match.players:
                    seat = ScheduledSeat.objects.create(
                        match = scheduled_match,
                        participant = player,
                    )
                if len(_match.players) == 1:
                    MatchResult.objects.create(
                        scheduled_match = scheduled_match
                    )
                    SeatResult.objects.create(
                        scheduled_seat = seat,
                        wins = 0,
                    )
        return scheduled_round

    def _complete_limited_session(self) -> None:
        try:
            self.limited_session.complete()
        except models.Model.DoesNotExist:
            pass

    def complete(self) -> to.TournamentResult[TournamentParticipant]:
        result = self.tournament.get_result(self.completed_rounds)
        with transaction.atomic():
            for winner in result.winners:
                TournamentWinner.objects.create(
                    tournament = self,
                    participant = winner,
                )
            self.state = self.TournamentState.FINISHED
            self.finished_at = datetime.datetime.now()
            self.save(update_fields = ('state', 'finished_at'))
            self._complete_limited_session()
        return result

    def advance(self) -> None:
        if ScheduledMatch.objects.filter(
            round__tournament = self,
            round__index = self.rounds.aggregate(Max('index'))['index__max'] or 0,
            result__isnull = True,
        ).exists():
            return

        if not self.schedule_next_round():
            self.complete()

    def cancel(self) -> Tournament:
        with transaction.atomic():
            self.state = self.TournamentState.CANCELED
            self.finished_at = datetime.datetime.now()
            self.save(update_fields = ('state', 'finished_at'))
            self._complete_limited_session()
        return self


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete = models.CASCADE, related_name = 'participants')
    deck = models.ForeignKey('limited.PoolDeck', on_delete = models.PROTECT, related_name = 'tournament_entries')
    player = models.ForeignKey(get_user_model(), on_delete = models.PROTECT, related_name = 'tournament', null = True)
    seed = models.FloatField(default = 0.)

    class Meta:
        ordering = '-seed',


class TournamentRound(TimestampedModel):
    tournament = models.ForeignKey(Tournament, on_delete = models.CASCADE, related_name = 'rounds')
    index = models.PositiveSmallIntegerField()

    class Meta:
        unique_together = ('tournament_id', 'index')

    @property
    def completed_round(self) -> to.CompletedRound[TournamentParticipant]:
        return to.CompletedRound(
            frozenset(
                to.CompletedMatch(
                    results = {
                        seat.participant: seat.result.wins
                        for seat in
                        match.seats.all()
                    },
                    draws = match.result.draws,
                )
                for match in
                self.matches.prefetch_related(
                    'seats',
                    'seats__participant',
                    'seats__result',
                    'result',

                )
            )
        )


class ScheduledMatch(models.Model):
    round = models.ForeignKey(TournamentRound, on_delete = models.CASCADE, related_name = 'matches')


class ScheduledSeat(models.Model):
    match = models.ForeignKey(ScheduledMatch, on_delete = models.CASCADE, related_name = 'seats')
    participant = models.ForeignKey(TournamentParticipant, on_delete = models.CASCADE, related_name = 'scheduled_tournament_seats')


class MatchResult(TimestampedModel):
    draws = models.IntegerField(default = 0)
    scheduled_match = models.OneToOneField(ScheduledMatch, on_delete = models.CASCADE, related_name = 'result')


class SeatResult(models.Model):
    scheduled_seat = models.OneToOneField(ScheduledSeat, on_delete = models.CASCADE, related_name = 'result')
    wins = models.PositiveSmallIntegerField()


class TournamentWinner(TimestampedModel):
    tournament = models.ForeignKey(Tournament, on_delete = models.CASCADE, related_name = 'results')
    participant = models.ForeignKey(TournamentParticipant, on_delete = models.CASCADE, related_name = 'wins')
