import typing as t

from django.core.management.base import BaseCommand

import mkmcheck
from mkmcheck.model import models
from mkmcheck.wishload.fetch import WishListFetcher
from wishlist.models import (
    WishList, Wish, CardboardWish, IsBorder, IsMinimumCondition, IsLanguage,
    IsFoil, IsAltered, IsSigned, FromExpansions, ExpansionCode
)


class Command(BaseCommand):
    help = 'fetch wishlist from sheets'

    def _convert_requirement(
        self,
        requirement: models.Requirement,
        cardboard_wish: CardboardWish,
    ) -> None:

        if isinstance(requirement, models.IsBorder):
            IsBorder.objects.create(border = requirement.border, cardboard_wish = cardboard_wish)

        elif isinstance(requirement, models.FromExpansions):
            _requirement = FromExpansions.objects.create(cardboard_wish = cardboard_wish)
            for code in requirement.expansion_codes:
                ExpansionCode.objects.create(code = code, requirement = _requirement)

        elif isinstance(requirement, models.IsMinimumCondition):
            IsMinimumCondition.objects.create(condition = requirement.condition, cardboard_wish = cardboard_wish)

        elif isinstance(requirement, models.IsLanguage):
            IsLanguage.objects.create(language = requirement.language, cardboard_wish = cardboard_wish)

        elif isinstance(requirement, models.IsFoil):
            IsFoil.objects.create(is_foil = requirement.is_foil, cardboard_wish = cardboard_wish)

        elif isinstance(requirement, models.IsAltered):
            IsAltered.objects.create(is_altered = requirement.is_altered, cardboard_wish = cardboard_wish)

        elif isinstance(requirement, models.IsSigned):
            IsSigned.objects.create(is_signed = requirement.is_signed, cardboard_wish = cardboard_wish)

    def _convert_cardboard_wish(self, cardboard_wish: models.CardboardWish, wish: Wish) -> None:
        _cardboard_wish = CardboardWish.objects.create(
            cardboard_name = cardboard_wish.cardboard_name,
            minimum_amount = cardboard_wish.minimum_amount,
            wish = wish,
        )

        for requirement in cardboard_wish.requirements:
            self._convert_requirement(requirement, _cardboard_wish)

    def _convert_wish(self, wish: models.Wish, wish_list: WishList) -> None:
        _wish = Wish.objects.create(
            weight = wish.weight,
            wish_list = wish_list,
        )

        for cardboard_wish in wish.cardboard_wishes:
            self._convert_cardboard_wish(cardboard_wish, _wish)

    def _convert_wish_list(self, wish_list: models.WishList) -> WishList:
        _wish_list = WishList.objects.create(name = 'wishlist')

        for wish in wish_list.wishes:
            self._convert_wish(wish, _wish_list)

        return _wish_list

    def handle(self, *args, **options):
        # models.create(mkmcheck.engine)
        wish_list_fetcher = WishListFetcher(
            db = mkmcheck.db,
            spreadsheet_id = mkmcheck.SHEET_ID,
            sheet_name = mkmcheck.INPUT_SHEET_NAME,
        )

        fetched_wish_list = wish_list_fetcher.fetch()

        converted_wish_list = self._convert_wish_list(fetched_wish_list)

        print(converted_wish_list)
