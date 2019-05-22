
import json

from rest_framework import serializers


class JsonField(serializers.Field):

	def to_internal_value(self, data):
		return json.loads(data)
		# print(data)
		# return data

	def to_representation(self, value):
		print(value)
		return json.loads(value)


class CubeContainerSerializer(serializers.Serializer):
	id = serializers.IntegerField(read_only=True)
	created_at = serializers.DateTimeField(read_only=True)
	checksum = serializers.CharField(read_only=True)

	def update(self, instance, validated_data):
		pass

	def create(self, validated_data):
		pass


class FullCubeContainerSerializer(CubeContainerSerializer):
	cube_content = JsonField()