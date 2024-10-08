import json
import typing as t
from distutils.util import strtobool

from django.contrib.auth import authenticate, get_user_model
from magiccube.collections.laps import TrapCollection
from mtgorp.models.interfaces import Cardboard, Printing
from mtgorp.models.serilization.serializeable import compacted_model
from mtgorp.models.serilization.strategies.raw import RawStrategy
from rest_framework import serializers

from api import models
from api.serialization import orpserialize
from utils.serialization.fields import EnumSerializerField
from utils.values import JAVASCRIPT_DATETIME_FORMAT


class OrpSerializerField(serializers.Field):
    def __init__(
        self,
        *args,
        model_serializer: t.Type[orpserialize.ModelSerializer],
        **kwargs,
    ):
        kwargs["read_only"] = True
        self._model_serializer = model_serializer
        super().__init__(*args, **kwargs)

    def to_internal_value(self, data):
        return json.loads(data)

    def to_representation(self, value):
        if self.context.get("request") and strtobool(self.context["request"].query_params.get("native", "0")):
            if isinstance(value, Cardboard):
                return value.name
            if isinstance(value, Printing):
                return value.id
            return RawStrategy.serialize(value)
        return self._model_serializer.serialize(value)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ("id", "username")


class FullUserSerializer(UserSerializer):
    date_joined = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)

    class Meta:
        model = get_user_model()
        fields = ("id", "username", "date_joined")


class ImageBundleSerializer(serializers.ModelSerializer):
    target = EnumSerializerField(models.ReleaseImageBundle.Target)

    class Meta:
        model = models.ReleaseImageBundle
        fields = ("id", "url", "target")


class MinimalVersionedCubeSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)

    class Meta:
        model = models.VersionedCube
        fields = ("id", "name", "created_at", "author", "description")


class NameCubeReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CubeRelease
        fields = ("id", "name")


class MinimalCubeReleaseSerializer(NameCubeReleaseSerializer):
    created_at = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)

    class Meta:
        model = models.CubeRelease
        fields = ("id", "name", "created_at", "checksum", "intended_size", "versioned_cube_id")


class ConstrainedNodesSerializer(serializers.ModelSerializer):
    constrained_nodes = OrpSerializerField(
        model_serializer=orpserialize.ConstrainedNodesOrpSerializer,
    )
    group_map = OrpSerializerField(
        model_serializer=orpserialize.GroupMapSerializer,
    )

    class Meta:
        model = models.ConstrainedNodes
        fields = ("constrained_nodes", "group_map")


class CubePatchSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True, format=JAVASCRIPT_DATETIME_FORMAT)
    versioned_cube_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source="versioned_cube",
        queryset=models.VersionedCube.objects.all(),
    )
    versioned_cube = MinimalVersionedCubeSerializer(read_only=True)

    patch = OrpSerializerField(
        model_serializer=orpserialize.CubePatchOrpSerializer,
    )

    class Meta:
        model = models.CubePatch
        fields = ("id", "created_at", "author", "description", "versioned_cube_id", "versioned_cube", "patch", "name")


class CubeReleaseSerializer(MinimalCubeReleaseSerializer):
    versioned_cube = MinimalVersionedCubeSerializer(read_only=True)


class FullCubeReleaseSerializer(CubeReleaseSerializer):
    cube = OrpSerializerField(
        model_serializer=orpserialize.ReleasableSerializer,
    )
    constrained_nodes = ConstrainedNodesSerializer(read_only=True)
    image_bundles = ImageBundleSerializer(many=True)
    infinites = OrpSerializerField(model_serializer=orpserialize.InfinitesSerializer)

    class Meta:
        model = models.CubeRelease
        fields = (
            "id",
            "name",
            "created_at",
            "checksum",
            "intended_size",
            "versioned_cube",
            "constrained_nodes",
            "image_bundles",
            "infinites",
            "cube",
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Unable to login")

    def update(self, instance, validated_data):
        raise NotImplementedError()

    def create(self, validated_data):
        raise NotImplementedError()


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    email = serializers.CharField()
    invite_token = serializers.CharField()

    def update(self, instance, validated_data):
        raise NotImplementedError()

    def create(self, validated_data):
        raise NotImplementedError()


class ParseConstrainedNodeSerializer(serializers.Serializer):
    query = serializers.CharField()
    groups = serializers.CharField(required=False, allow_blank=True)
    weight = serializers.IntegerField(required=False, allow_null=True)

    def update(self, instance, validated_data):
        raise NotImplementedError()

    def create(self, validated_data):
        raise NotImplementedError()


class ParseTrapSerializer(serializers.Serializer):
    query = serializers.CharField()
    intention_type = serializers.CharField()

    def update(self, instance, validated_data):
        raise NotImplementedError()

    def create(self, validated_data):
        raise NotImplementedError()


class ResetSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()

    def update(self, instance, validated_data):
        raise NotImplementedError()

    def create(self, validated_data):
        raise NotImplementedError()


class ClaimResetSerializer(serializers.Serializer):
    code = serializers.CharField()
    new_password = serializers.CharField()

    def update(self, instance, validated_data):
        raise NotImplementedError()

    def create(self, validated_data):
        raise NotImplementedError()


class InviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Invite
        fields = ("email",)


class VersionedCubeSerializer(MinimalVersionedCubeSerializer):
    releases = MinimalCubeReleaseSerializer(read_only=True, many=True)

    class Meta:
        model = models.VersionedCube
        fields = ("id", "name", "created_at", "author", "description", "releases")


class DistributionPossibilitySerializer(serializers.ModelSerializer):
    trap_collection = OrpSerializerField(
        model_serializer=orpserialize.TrapCollectionSerializer,
    )
    added_traps = serializers.SerializerMethodField()
    removed_traps = serializers.SerializerMethodField()

    @classmethod
    def get_added_traps(cls, obj: models.DistributionPossibility) -> compacted_model:
        return orpserialize.TrapCollectionSerializer.serialize(
            obj.trap_collection - TrapCollection(obj.release.cube.garbage_traps)
        )

    @classmethod
    def get_removed_traps(cls, obj: models.DistributionPossibility) -> compacted_model:
        return orpserialize.TrapCollectionSerializer.serialize(
            TrapCollection(obj.release.cube.garbage_traps) - obj.trap_collection
        )

    class Meta:
        model = models.DistributionPossibility
        fields = (
            "id",
            "created_at",
            "pdf_url",
            "added_pdf_url",
            "removed_pdf_url",
            "trap_collection",
            "fitness",
            "added_traps",
            "removed_traps",
        )


class EEErrorSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.EEError
        fields = ("error", "trace")
