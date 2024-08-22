import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from draft.models import DraftPick


class Command(BaseCommand):
    help = "Migrate booster ids on DraftPicks"

    def handle(self, *args, **options):
        logging.basicConfig(format="%(levelname)s %(message)s", level=logging.INFO)

        with transaction.atomic():
            for draft_pick in DraftPick.objects.all():
                draft_pick.booster_id = draft_pick.pack.booster_id
                draft_pick.save(update_fields=("booster_id",))
