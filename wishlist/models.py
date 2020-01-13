import itertools

from distutils.util import strtobool

from django.contrib.auth import get_user_model
from django.db import models

from typedmodels.models import TypedModel

from mtgorp.models.persistent.attributes.borders import Border

from utils.fields import EnumField
from utils.mixins import TimestampedModel
from utils.values import JAVASCRIPT_DATETIME_FORMAT

from wishlist.values import Condition, Language


User = get_user_model()


class WishList(TimestampedModel, models.Model):
    name = models.CharField(max_length = 255)
    owner = models.ForeignKey(User, on_delete = models.CASCADE, related_name = 'wishlists')

    @property
    def last_updated(self):
        return max(
            itertools.chain(
                (self.updated_at,),
                (
                    wish.last_updated
                    for wish in
                    self.wishes.all()
                )
            )
        )


class Wish(TimestampedModel, models.Model):
    wish_list = models.ForeignKey(WishList, on_delete = models.CASCADE, related_name = 'wishes')
    weight = models.PositiveSmallIntegerField(default = 1)
    comment = models.CharField(max_length = 255, default = '')
    updated_by = models.ForeignKey(User, on_delete = models.CASCADE, related_name = 'modified_wishes')

    @property
    def last_updated(self):
        return max(
            itertools.chain(
                (self.updated_at,),
                (
                    cardboard_wish.last_updated
                    for cardboard_wish in
                    self.cardboard_wishes.all()
                )
            )
        )


class CardboardWish(TimestampedModel, models.Model):
    cardboard_name = models.CharField(max_length = 255)
    minimum_amount = models.PositiveSmallIntegerField(default = 1)
    wish = models.ForeignKey(Wish, on_delete = models.CASCADE, related_name = 'cardboard_wishes')
    updated_by = models.ForeignKey(User, on_delete = models.CASCADE, related_name = 'modified_cardboard_wishes')

    @property
    def last_updated(self):
        return max(
            itertools.chain(
                (self.updated_at,),
                self.requirements.all().values_list('updated_at', flat = True),
            )
        )


class Requirement(TimestampedModel, TypedModel):
    cardboard_wish = models.ForeignKey(CardboardWish, on_delete = models.DO_NOTHING, related_name = 'requirements')
    updated_by = models.ForeignKey(User, on_delete = models.DO_NOTHING, related_name = 'modified_requirements')

    def serialize(self):
        return {
            'id': self.id,
            'type': self.__class__.__name__,
            'created_at': self.created_at.strftime(JAVASCRIPT_DATETIME_FORMAT),
            'updated_at': self.updated_at.strftime(JAVASCRIPT_DATETIME_FORMAT),
        }

    @classmethod
    def deserialize(cls, values):
        return cls._typedmodels_simple_registry[values['type']].deserialize(values)


class FromExpansions(Requirement):
    pass


class ExpansionCode(models.Model):
    code = models.CharField(max_length = 7)
    requirement = models.ForeignKey(FromExpansions, on_delete = models.CASCADE, related_name = 'expansion_codes')


class IsBorder(Requirement):
    border = EnumField(Border, null = True)

    def serialize(self):
        return {
            **super().serialize(),
            'border': self.border.name,
        }

    @classmethod
    def deserialize(cls, values):
        return cls(
            border = Border[values['border']],
        )


class IsMinimumCondition(Requirement):
    condition = EnumField(Condition, null = True)

    def serialize(self):
        return {
            **super().serialize(),
            'condition': self.condition.name,
        }

    @classmethod
    def deserialize(cls, values):
        return cls(
            condition = Condition[values['condition']]
        )


class IsLanguage(Requirement):
    language = EnumField(Language, null = True)

    def serialize(self):
        return {
            **super().serialize(),
            'language': self.language.name,
        }

    @classmethod
    def deserialize(cls, values):
        return cls(
            language = Language[values['language']]
        )


class IsFoil(Requirement):
    is_foil = models.BooleanField(null = True)

    def serialize(self):
        return {
            **super().serialize(),
            'is_foil': str(self.is_foil),
        }

    @classmethod
    def deserialize(cls, values):
        return cls(
            is_foil = strtobool(values['is_foil'])
        )


class IsAltered(Requirement):
    is_altered = models.BooleanField(null = True)

    def serialize(self):
        return {
            **super().serialize(),
            'is_altered': str(self.is_altered),
        }

    @classmethod
    def deserialize(cls, values):
        return cls(
            is_altered = strtobool(values['is_altered'])
        )



class IsSigned(Requirement):
    is_signed = models.BooleanField(null = True)

    def serialize(self):
        return {
            **super().serialize(),
            'is_signed': str(self.is_signed),
        }

    @classmethod
    def deserialize(cls, values):
        return cls(
            is_signed = strtobool(values['is_signed'])
        )

