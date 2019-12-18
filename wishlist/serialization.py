from __future__ import annotations

import typing as t

from mkmcheck.model.models import WishList, Wish, CardboardWish


class CardboardWishSerializer(object):

    def serialize(self, cardboard_wish: CardboardWish) -> t.Any:
        return {
            'id': cardboard_wish.id,
            'cardboard_name': cardboard_wish.cardboard_name,
            'minimum_amount': cardboard_wish.minimum_amount,
            'requirements': None, # TODO
        }

class WishSerializer(object):

    def serialize(self, wish: Wish) -> t.Any:
        return {
            'id': wish.id,
            'weight': wish.weight,
            'cardboard_wishes': [

            ],
        }


class WishListSerializer(object):

    def serialize(self, wish_list: WishList) -> t.Any:
        return {
            'wishes': {

            }
        }