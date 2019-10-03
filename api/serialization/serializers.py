import json
import typing as t

from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

from magiccube.collections.laps import TrapCollection
from mtgorp.models.serilization.serializeable import Serializeable
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.serilization.strategies.strategy import Strategy

from magiccube.collections.cube import Cube
from magiccube.collections.nodecollection import NodeCollection, GroupMap
from magiccube.update.cubeupdate import CubePatch

from resources.staticdb import db
from api import models
from api.serialization import orpserialize


class OrpModelField(serializers.Field):

    def __init__(
        self,
        *args,
        model_serializer: t.Type[orpserialize.ModelSerializer],
        serializeable_type: t.Type[Serializeable],
        strategy: Strategy,
        **kwargs,
    ):
        kwargs['read_only'] = True
        self._model_serializer = model_serializer
        self._serializeable_type = serializeable_type
        self._strategy = strategy
        super().__init__(*args, **kwargs)

    def to_internal_value(self, data):
        return json.loads(data)

    def to_representation(self, value):
        return self._model_serializer.serialize(
            self._strategy.deserialize(
                self._serializeable_type,
                value
            )
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ('id', 'username')


class MinimalVersionedCubeSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = models.VersionedCube
        fields = ('id', 'name', 'created_at', 'author', 'description')


class MinimalCubeReleaseSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    name = serializers.CharField(read_only=True)
    checksum = serializers.CharField(read_only=True)
    intended_size = serializers.IntegerField(read_only=True)

    def update(self, instance, validated_data):
        raise NotImplemented()

    def create(self, validated_data):
        raise NotImplemented()


class ConstrainedNodesSerializer(serializers.ModelSerializer):
    constrained_nodes_content = OrpModelField(
        model_serializer = orpserialize.ConstrainedNodesOrpSerializer,
        serializeable_type = NodeCollection,
        strategy = JsonId(db),
    )
    group_map_content = OrpModelField(
        model_serializer = orpserialize.GroupMapSerializer,
        serializeable_type = GroupMap,
        strategy = JsonId(db),
    )

    class Meta:
        model = models.ConstrainedNodes
        fields = ('constrained_nodes_content', 'group_map_content')


class CubePatchSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    versioned_cube_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='versioned_cube',
        queryset=models.VersionedCube.objects.all(),
    )
    versioned_cube = MinimalVersionedCubeSerializer(read_only=True)

    content = OrpModelField(
        model_serializer = orpserialize.CubePatchOrpSerializer,
        serializeable_type = CubePatch,
        strategy = JsonId(db),
    )

    class Meta:
        model = models.CubePatch
        fields = ('id', 'created_at', 'author', 'description', 'versioned_cube_id', 'versioned_cube', 'content')


class CubeReleaseSerializer(MinimalCubeReleaseSerializer):
    versioned_cube = MinimalVersionedCubeSerializer(read_only=True)


class FullCubeReleaseSerializer(CubeReleaseSerializer):
    cube_content = OrpModelField(
        model_serializer = orpserialize.CubeSerializer,
        serializeable_type = Cube,
        strategy = JsonId(db),
    )
    constrained_nodes = ConstrainedNodesSerializer(read_only=True)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError('Unable to login')

    def update(self, instance, validated_data):
        raise NotImplemented()

    def create(self, validated_data):
        raise NotImplemented()


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    email = serializers.CharField()
    invite_token = serializers.CharField()

    def update(self, instance, validated_data):
        raise NotImplemented()

    def create(self, validated_data):
        raise NotImplemented()


class ParseConstrainedNodeSerializer(serializers.Serializer):
    query = serializers.CharField()
    groups = serializers.CharField(required=False, allow_blank = True)
    weight = serializers.IntegerField(required=False, allow_null = True)

    def update(self, instance, validated_data):
        raise NotImplemented

    def create(self, validated_data):
        raise NotImplemented


class ParseTrapSerializer(serializers.Serializer):
    query = serializers.CharField()
    intention_type = serializers.CharField()

    def update(self, instance, validated_data):
        raise NotImplemented

    def create(self, validated_data):
        raise NotImplemented


class InviteSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Invite
        fields = ('email', )


class VersionedCubeSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    releases = MinimalCubeReleaseSerializer(read_only=True, many=True)

    class Meta:
        model = models.VersionedCube
        fields = ('id', 'name', 'created_at', 'author', 'description', 'releases')


class DistributionPossibilitySerializer(serializers.ModelSerializer):
    content = OrpModelField(
        model_serializer = orpserialize.TrapCollectionSerializer,
        serializeable_type = TrapCollection,
        strategy = JsonId(db),
    )
    pdf_url = serializers.CharField(allow_null=True)

    class Meta:
        model = models.DistributionPossibility
        fields = ('id', 'created_at', 'pdf_url', 'content', 'fitness')