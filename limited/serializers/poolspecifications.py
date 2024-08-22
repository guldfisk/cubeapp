import typing as t

from rest_framework import serializers
from rest_framework.fields import empty

from limited import models


class BoosterSpecificationSerializer(serializers.Serializer):
    def run_validation(self, data: t.Union[t.Type[empty], t.Dict[str, t.Any]] = empty):
        pass

    def save(self, **kwargs):
        raise NotImplementedError()

    def update(self, instance, validated_data):
        raise NotImplementedError()

    def create(self, validated_data):
        raise NotImplementedError()

    def to_representation(self, instance: models.BoosterSpecification):
        return instance.serialize()


class PoolSpecificationSerializer(serializers.ModelSerializer):
    specifications = BoosterSpecificationSerializer(many=True, read_only=True)

    class Meta:
        model = models.PoolSpecification
        fields = ("id", "specifications")
