import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from draft.models import DraftSession


class Command(BaseCommand):
    help = 'Migrate Global pick numbers'

    def handle(self, *args, **options):
        logging.basicConfig(format = '%(levelname)s %(message)s', level = logging.INFO)

        with transaction.atomic():
            for draft_session in DraftSession.objects.all():
                for seat in draft_session.seats.all():
                    for idx, pick in enumerate(seat.picks.all().order_by('pack_number', 'pick_number')):
                        pick.global_pick_number = idx
                        pick.save(update_fields = ('global_pick_number',))
