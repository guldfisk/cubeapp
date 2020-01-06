from distutils.util import strtobool

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

    # class Meta:
    #     unique_together = ('cardboard_name', 'wish')


class Requirement(TypedModel):
    cardboard_wish = models.ForeignKey(CardboardWish, on_delete = models.CASCADE, related_name = 'requirements')

    def serialize(self):
        return {
            'id': self.id,
            'type': self.__class__.__name__,
        }

    @classmethod
    def deserialize(cls, values):
        return cls._typedmodels_simple_registry[values['type']].deserialize(values)


class FromExpansions(Requirement):
    pass


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
            'condition': Condition.name,
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
            is_foil = strtobool(values['is_signed'])
        )

