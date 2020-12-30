from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Max

from mtgorp.models.tournaments.matches import FirstToN

from limited.models import LimitedSession, MatchPlayer, Pool
from tournaments.models import ScheduledMatch, SeatResult, ScheduledSeat, MatchResult, Tournament


class Command(BaseCommand):
    help = 'Friendship ended with limited sessions'

    def handle(self, *args, **options):
        with transaction.atomic():
            for pool in Pool.objects.filter(pool_decks__isnull = False):
                pool.pool_decks.filter(
                    created_at__lt = pool.pool_decks.aggregate(Max('created_at'))['created_at__max']
                ).update(latest = False)

            for limited_session in LimitedSession.objects.filter(
                tournament__isnull = True
            ).exclude(
                state = LimitedSession.LimitedSessionState.DECK_BUILDING,
            ).order_by('created_at'):
                previous_wins = MatchPlayer.objects.filter(
                    match_result__session = limited_session,
                ).aggregate(Max('wins'))['wins__max']
                player_count = limited_session.pools.count()
                if player_count <= 1:
                    continue
                if previous_wins is None:
                    previous_wins = 2 if player_count <= 3 else 3
                match_type = FirstToN(previous_wins)
                limited_session.match_type = match_type
                limited_session.save(update_fields = ('match_type',))

                if limited_session.pools.filter(pool_decks__isnull = True).exists():
                    continue

                tournament = limited_session.create_tournament()

                scheduled_matches_map = {
                    frozenset(
                        seat.participant.player
                        for seat in
                        scheduled_match.seats.all()
                    ): scheduled_match
                    for scheduled_match in
                    ScheduledMatch.objects.filter(
                        round__tournament = tournament,
                    ).prefetch_related(
                        'seats',
                        'seats__participant__player',
                    )
                }

                for result in limited_session.results.prefetch_related('players').all():
                    scheduled_match = scheduled_matches_map[frozenset(player.user for player in result.players.all())]
                    MatchResult.objects.create(
                        draws = result.draws,
                        scheduled_match = scheduled_match,
                    )
                    for player in result.players.all():
                        SeatResult.objects.create(
                            scheduled_seat = ScheduledSeat.objects.get(
                                participant__player = player.user,
                                match = scheduled_match,
                            ),
                            wins = player.wins,
                        )

                tournament.advance()

                if (
                    limited_session.state == LimitedSession.LimitedSessionState.FINISHED
                    and tournament.state == Tournament.TournamentState.ONGOING
                ):
                    tournament.cancel()
