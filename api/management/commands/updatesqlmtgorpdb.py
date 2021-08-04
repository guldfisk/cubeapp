import logging

from django.core.management.base import BaseCommand

from mtgorp.db.create import get_sql_database_updater
from mtgorp.managejson.update import check_and_update

from resources.staticdb import SqlContext


class Command(BaseCommand):
    help = 'Rebuild mtgorp SQL database. REMEMBER THIS ONLY WORKS IF DB ISN\'T BLOCKED, E.I. IS IN USE.'

    def handle(self, *args, **options):
        logging.basicConfig(format = '%(levelname)s %(message)s', level = logging.INFO)

        SqlContext.init()
        check_and_update(
            force = True,
            updaters = (
                get_sql_database_updater(
                    SqlContext.scoped_session,
                    SqlContext.engine,
                ),
            ),
        )
