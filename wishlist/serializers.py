import typing as t

from rest_framework import serializers, fields
from rest_framework.exceptions import ValidationError
from rest_framework.fields import empty

from api.serialization.orpserialize import CardboardSerializer
from resources.staticdb import db
from utils.values import JAVASCRIPT_DATETIME_FORMAT
from wishlist import models
from wishlist.models import Requirement


class CardboardNameSerializer(serializers.CharField):

    def to_representation(self, value):
        return CardboardSerializer.serialize(
            db.cardboards[super().to_representation(value)]
        )


class RequirementSerializer(serializers.Serializer):

    def run_validation(self, data: t.Union[t.Type[empty], t.Dict[str, t.Any]] = empty):
        cardboard_wish_id = data.get('cardboard_wish_id')

        if cardboard_wish_id is None:
            raise ValidationError([])

        try:
            cardboard_wish_id = int(cardboard_wish_id)
        except ValueError:
            raise ValidationError([])

        try:
            requirement = Requirement.deserialize(
                {} if data is empty else data
            )
            requirement.cardboard_wish_id = cardboard_wish_id
            return requirement

        except KeyError as e:
            raise ValidationError([['some field', str(e)]])

    def save(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self.validated_data, k, v)
        self.validated_data.save()

    def update(self, instance, validated_data):
        raise NotImplemented()

    def create(self, validated_data):
        raise NotImplemented()

    def to_representation(self, instance: models.Requirement):
        return instance.serialize()


def _validate_cardboard_name(cardboard_name: str) -> None:
    if not cardboard_name in db.cardboards:
        raise ValidationError('Invalid cardboard name')


class CardboardWishSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    updated_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    requirements = RequirementSerializer(many = True, read_only = True)
    wish_id = fields.IntegerField(write_only = True)
    cardboard = CardboardNameSerializer(validators = [_validate_cardboard_name], source = 'cardboard_name')
    minimum_amount = fields.IntegerField(required = False)

    class Meta:
        model = models.CardboardWish
        fields = ('id', 'cardboard', 'minimum_amount', 'requirements', 'created_at', 'updated_at', 'wish_id')


class WishSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    updated_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    cardboard_wishes = CardboardWishSerializer(many = True, read_only = True)
    wish_list_id = fields.IntegerField(write_only = True)

    class Meta:
        model = models.Wish
        fields = ('id', 'weight', 'cardboard_wishes', 'created_at', 'updated_at', 'wish_list_id', 'comment')


class WishListSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)
    updated_at = serializers.DateTimeField(read_only = True, format = JAVASCRIPT_DATETIME_FORMAT)

    class Meta:
        model = models.WishList
        fields = ('id', 'created_at', 'updated_at', 'name')
