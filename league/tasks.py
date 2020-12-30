from celery import shared_task

from league.models import HOFLeague, LeagueError
from tournaments.models import Tournament


@shared_task()
def create_seasons() -> None:
    for league in HOFLeague.objects.exclude(seasons__tournament__state = Tournament.TournamentState.ONGOING).all():
        try:
            league.create_season()
        except LeagueError:
            pass
