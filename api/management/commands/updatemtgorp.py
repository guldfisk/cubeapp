import logging

from django.core.management.base import BaseCommand
from mtgorp.managejson.update import check_and_update

from resources.staticdb import SqlContext


class Command(BaseCommand):
    help = "Rebuild mtgorp pickle database."

    def handle(self, *args, **options):
        logging.basicConfig(format="%(levelname)s %(message)s", level=logging.INFO)

        SqlContext.init()
        check_and_update(force=True)
