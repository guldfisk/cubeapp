from django.db import transaction

from celery import shared_task

from elo.utils import adjust_eloeds

from league.models import HOFLeague, LeagueError, Season, DeckRating
from tournaments.models import Tournament, ScheduledMatch


@shared_task()
def create_seasons() -> None:
    update_ratings()
    for league in HOFLeague.objects.exclude(seasons__tournament__state = Tournament.TournamentState.ONGOING).all():
        try:
            league.create_season()
        except LeagueError:
            pass


@shared_task()
def update_ratings() -> None:
    with transaction.atomic():
        for season in Season.objects.filter(
            ratings_processed = False,
            tournament__state = Tournament.TournamentState.FINISHED,
        ).order_by('created_at'):
            for match in ScheduledMatch.objects.filter(
                round__tournament_id = season.tournament_id,
            ).order_by('round__index').prefetch_related(
                'seats',
                'seats__result',
            ):
                winners = match.winners
                if len(winners) != 1:
                    continue

                winner = winners[0]

                rating_map = {
                    seat.participant_id: DeckRating.objects.get_or_create(
                        league_id = season.league_id,
                        deck_id = seat.participant.deck_id,
                        defaults = {
                            'rating': 1000,
                        }
                    )[0]
                    for seat in
                    match.seats.all()
                }

                for seat in match.seats.all():
                    if seat.participant_id != winner.id:
                        adjust_eloeds(rating_map[winner.id], rating_map[seat.participant_id])

                for rating in rating_map.values():
                    rating.save(update_fields = ('rating',))

            season.ratings_processed = True
            season.save(update_fields = ('ratings_processed',))
