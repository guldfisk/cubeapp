import logging

from django.core.management.base import BaseCommand
from django.db import transaction
from magiccube.collections.cube import Cube

from api.models import RelatedPrinting
from draft.models import DraftPick


class Command(BaseCommand):
    help = "Create related printing objects for picks."

    def handle(self, *args, **options):
        logging.basicConfig(format="%(levelname)s %(message)s", level=logging.INFO)

        with transaction.atomic():
            for pick in DraftPick.objects.all():
                RelatedPrinting.objects.bulk_create(
                    (
                        RelatedPrinting(
                            related=pick,
                            printing_id=p.id,
                        )
                        for p in set(Cube(pick.cubeables).all_printings)
                    )
                )
