import itertools

from celery import shared_task
from django.db import transaction
from elo.utils import adjust_eloeds

from league.models import DeckRating, HOFLeague, LeagueError, QuickMatch, Season
from league.values import DEFAULT_RATING
from tournaments.models import ScheduledMatch, Tournament


@shared_task()
def create_seasons() -> None:
    update_ratings()
    for league in HOFLeague.objects.exclude(seasons__tournament__state=Tournament.TournamentState.ONGOING).all():
        try:
            league.create_season()
        except LeagueError:
            pass


@shared_task()
def update_ratings() -> None:
    with transaction.atomic():
        for rating_event in sorted(
            itertools.chain(
                Season.objects.filter(
                    ratings_processed=False,
                    tournament__state=Tournament.TournamentState.FINISHED,
                ),
                QuickMatch.objects.filter(
                    ratings_processed=False,
                    rated=True,
                    tournament__state=Tournament.TournamentState.FINISHED,
                ),
            ),
            key=lambda i: i.created_at,
        ):
            for match in (
                ScheduledMatch.objects.filter(
                    round__tournament_id=rating_event.tournament_id,
                )
                .order_by("round__index")
                .prefetch_related(
                    "seats",
                    "seats__result",
                )
            ):
                winners = match.winners
                if len(winners) != 1:
                    continue

                winner = winners[0]

                rating_map = {
                    seat.participant_id: DeckRating.objects.get_or_create(
                        league_id=rating_event.league_id,
                        deck_id=seat.participant.deck_id,
                        defaults={
                            "rating": DEFAULT_RATING,
                        },
                    )[0]
                    for seat in match.seats.all()
                }

                for seat in match.seats.all():
                    if seat.participant_id != winner.id:
                        adjust_eloeds(
                            rating_map[winner.id], rating_map[seat.participant_id], k=rating_event.league.rating_change
                        )

                for rating in rating_map.values():
                    rating.save(update_fields=("rating",))

            rating_event.ratings_processed = True
            rating_event.save(update_fields=("ratings_processed",))
