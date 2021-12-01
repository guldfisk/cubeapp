import logging
import os

from django.core.management.base import BaseCommand

from mtgorp.managejson import paths


class Command(BaseCommand):
    help = 'Replace current pickle db with staging pickle db.'

    def handle(self, *args, **options):
        logging.basicConfig(format = '%(levelname)s %(message)s', level = logging.INFO)

        os.replace(os.path.join(paths.APP_DATA_PATH, 'staging', 'db'), os.path.join(paths.APP_DATA_PATH, 'db'))
