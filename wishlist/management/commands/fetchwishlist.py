from django.core.management.base import BaseCommand

import mkmcheck
from mkmcheck.model import models
from mkmcheck.wishload.fetch import WishListFetcher


class Command(BaseCommand):
    help = 'fetch wishlist from sheets'

    def handle(self, *args, **options):
        models.create(mkmcheck.engine)
        wish_list_fetcher = WishListFetcher(
            db = mkmcheck.db,
            spreadsheet_id = mkmcheck.SHEET_ID,
            sheet_name = mkmcheck.INPUT_SHEET_NAME,
        )

        fetched_wish_list = wish_list_fetcher.fetch()
        session = mkmcheck.ScopedSession()
        session.add(fetched_wish_list)
        session.commit()

