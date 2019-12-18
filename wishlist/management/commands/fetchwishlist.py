from django.core.management.base import BaseCommand

import mkmcheck
from mkmcheck.wishload.fetch import WishListFetcher


class Command(BaseCommand):
    help = 'fetch wishlist from sheets'

    def handle(self, *args, **options):
        wish_list_fetcher = WishListFetcher(
            db = mkmcheck.db,
            spreadsheet_id = mkmcheck.SHEET_ID,
            sheet_name = mkmcheck.INPUT_SHEET_NAME,
        )

        fetched_wish_list = wish_list_fetcher.fetch()

        print(fetched_wish_list)

