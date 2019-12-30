from django.db import models

from typedmodels.models import TypedModel

from mtgorp.models.persistent.attributes.borders import Border
from utils.fields import EnumField
from wishlist.values import Condition, Language


class WishList(models.Model):
    created_at = models.DateTimeField(auto_now = True, editable = False)


class Wish(models.Model):
    wish_list = models.ForeignKey(WishList, on_delete = models.CASCADE, related_name = 'wishes')
    weight = models.PositiveSmallIntegerField(default = 1)


class CardboardWish(models.Model):
    cardboard_name = models.CharField(max_length = 255)
    minimum_amount = models.PositiveSmallIntegerField(default = 1)
    wish = models.ForeignKey(Wish, on_delete = models.CASCADE, related_name = 'cardboard_wishes')


class Requirement(TypedModel):
    cardboard_wish = models.ForeignKey(CardboardWish, on_delete = models.CASCADE, related_name = 'requirements')


class FromExpansions(Requirement):
    pass


class IsBorder(Requirement):
    border = EnumField(Border, null = True)


class IsMinimumCondition(Requirement):
    condition = EnumField(Condition, null = True)


class IsLanguage(Requirement):
    language = EnumField(Language, null = True)


class IsFoil(Requirement):
    is_foil = models.BooleanField(null = True)


class IsAltered(Requirement):
    is_altered = models.BooleanField(null = True)


class IsSigned(Requirement):
    is_signed = models.BooleanField(null = True)
