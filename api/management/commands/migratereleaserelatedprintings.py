import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import CubeRelease, RelatedPrinting


class Command(BaseCommand):
    help = "Create related printing objects for releases."

    def handle(self, *args, **options):
        logging.basicConfig(format="%(levelname)s %(message)s", level=logging.INFO)

        with transaction.atomic():
            for release in CubeRelease.objects.all():
                RelatedPrinting.objects.bulk_create(
                    (
                        RelatedPrinting(
                            related=release,
                            printing_id=p.id,
                        )
                        for p in set(release.cube.all_printings)
                    )
                )
