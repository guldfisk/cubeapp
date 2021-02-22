from django.core.management.base import BaseCommand
from django.db import transaction

from tournaments.models import Tournament


class Command(BaseCommand):
    help = 'Migrate placements'

    def handle(self, *args, **options):
        with transaction.atomic():
            for tournament in Tournament.objects.filter(state = Tournament.TournamentState.FINISHED):
                results = tournament.tournament.get_ranked_players(tournament.completed_rounds)
                for idx, tier in enumerate(results):
                    for participant in tier:
                        participant.placement = idx
                        participant.save(update_fields = ('placement',))
