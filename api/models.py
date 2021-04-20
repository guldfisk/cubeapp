from __future__ import annotations

import datetime
import hashlib
import random
import string
import typing as t
from enum import Enum

from botocore.client import BaseClient

# from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import UserModel
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.timezone import now

from mocknames.generate import NameGenerator

from magiccube.collections.infinites import Infinites
from magiccube.collections.laps import TrapCollection
from magiccube.collections.meta import MetaCube

from magiccube.collections.cube import Cube
from magiccube.collections.nodecollection import NodeCollection, GroupMap
from magiccube.update.cubeupdate import CubePatch as Patch

from api.boto import get_boto_client, SPACES_ENDPOINT
from api.fields.orp import OrpField
from utils import mixins
from utils.fields import EnumField
from utils.methods import get_random_name, remove_prefix
from utils.mixins import TimestampedModel


class VersionedCube(mixins.SoftDeletionModel, models.Model):
    created_at = models.DateTimeField(default = now)
    name = models.CharField(max_length = 128)
    description = models.TextField()
    author = models.ForeignKey(
        get_user_model(),
        on_delete = models.CASCADE,
    )
    forked_from = models.ForeignKey(
        'VersionedCube',
        related_name = 'forks',
        null = True,
        on_delete = models.SET_NULL,
    )
    forked_from_release = models.ForeignKey(
        'CubeRelease',
        related_name = 'forks',
        null = True,
        on_delete = models.PROTECT,
    )

    @property
    def latest_release(self) -> CubeRelease:
        return self.releases.order_by('created_at').last()

    def full_release_history(self, before_inclusive: datetime.datetime) -> t.Iterator[CubeRelease]:
        for release in self.releases.filter(created_at__lte=before_inclusive).order_by('-created_at'):
            yield release
        if self.forked_from_release_id:
            yield from self.forked_from_release.versioned_cube.full_release_history(self.forked_from_release.created_at)


class CubeRelease(models.Model):
    created_at = models.DateTimeField(default = now)
    checksum = models.CharField(max_length = 256)
    name = models.CharField(max_length = 64)
    intended_size = models.PositiveIntegerField()
    cube: Cube = OrpField(model_type = Cube)
    infinites: Infinites = OrpField(model_type = Infinites)

    versioned_cube = models.ForeignKey(VersionedCube, on_delete = models.CASCADE, related_name = 'releases')

    rating_maps = GenericRelation(
        'rating.RatingMap',
        'ratings_for_object_id',
        'ratings_for_content_type',
    )

    class Meta:
        ordering = ('-created_at',)

    def as_meta_cube(self) -> MetaCube:
        return MetaCube(
            self.cube,
            self.constrained_nodes.constrained_nodes,
            self.constrained_nodes.group_map,
            self.infinites,
        )

    @property
    def previous_release(self) -> t.Optional[CubeRelease]:
        return CubeRelease.objects.filter(
            created_at__lt = self.created_at,
            versioned_cube = self.versioned_cube,
        ).order_by('created_at').last()

    def all_upstream_releases(self) -> t.Iterator[CubeRelease]:
        for release in CubeRelease.objects.filter(
            created_at__lt = self.created_at,
            versioned_cube = self.versioned_cube,
        ).order_by('-created_at'):
            yield release
        if self.versioned_cube.forked_from_release_id:
            yield from self.versioned_cube.forked_from_release.versioned_cube.full_release_history(
                self.versioned_cube.forked_from_release.created_at
            )

    @classmethod
    def create(cls, cube: Cube, versioned_cube: VersionedCube, infinites: Infinites, intended_size: int = 360) -> CubeRelease:
        return cls.objects.create(
            cube = cube,
            checksum = cube.persistent_hash(),
            name = NameGenerator().get_name(
                int(
                    hashlib.sha1(
                        cube.persistent_hash().encode('ASCII')
                    ).hexdigest(),
                    16,
                )
            ),
            versioned_cube = versioned_cube,
            intended_size = intended_size,
            infinites = infinites,
        )


class ConstrainedNodes(models.Model):
    constrained_nodes: NodeCollection = OrpField(NodeCollection)
    group_map: GroupMap = OrpField(GroupMap)
    release = models.OneToOneField(
        CubeRelease,
        related_name = 'constrained_nodes',
        on_delete = models.CASCADE,
    )


class CubePatch(models.Model):
    created_at = models.DateTimeField(default = now)
    description = models.TextField()
    patch: Patch = OrpField(model_type = Patch)
    name = models.CharField(max_length = 127, default = get_random_name)

    author = models.ForeignKey(
        get_user_model(),
        on_delete = models.CASCADE,
    )
    versioned_cube = models.ForeignKey(
        VersionedCube,
        on_delete = models.CASCADE,
        related_name = 'patches',
    )
    forked_from = models.ForeignKey(
        'CubePatch',
        related_name = 'forks',
        null = True,
        on_delete = models.SET_NULL,
    )

    def delete(self, using = None, keep_parents = False):
        for distribution in self.distribution_possibilities.all():
            distribution.delete_pdfs(save = False)
        return super().delete(using, keep_parents)


class DistributionPossibility(models.Model):
    created_at = models.DateTimeField(default = now)
    trap_collection: TrapCollection = OrpField(model_type = TrapCollection)
    pdf_url = models.CharField(max_length = 511, null = True)
    added_pdf_url = models.CharField(max_length = 511, null = True)
    removed_pdf_url = models.CharField(max_length = 511, null = True)
    patch_checksum = models.CharField(max_length = 255)
    distribution_checksum = models.CharField(max_length = 255)
    fitness = models.FloatField()

    patch = models.ForeignKey(
        CubePatch,
        on_delete = models.CASCADE,
        related_name = 'distribution_possibilities',
    )

    release = models.ForeignKey(
        CubeRelease,
        on_delete = models.CASCADE,
    )

    class Meta:
        unique_together = ('patch', 'patch_checksum', 'distribution_checksum')

    @classmethod
    def _delete_pdf_for_url(cls, url: str, client: BaseClient) -> None:
        client.delete_object(
            Key = remove_prefix(url, SPACES_ENDPOINT + 'phdk/'),
            Bucket = 'phdk',
        )

    def delete_pdfs(self, save: bool = True) -> None:
        client = get_boto_client()
        fields = ('pdf_url', 'added_pdf_url', 'removed_pdf_url')
        for attr in fields:
            url = getattr(self, attr)
            if url:
                self._delete_pdf_for_url(url, client)
                setattr(self, attr, None)
        if save:
            self.save(update_fields = fields)

    def delete(self, using = None, keep_parents = False):
        r = super().delete(using, keep_parents)
        self.delete_pdfs(save = False)
        return r


class LapChangePdf(models.Model):
    created_at = models.DateTimeField(default = now)
    pdf_url = models.CharField(max_length = 511)
    original_release = models.ForeignKey(
        CubeRelease,
        related_name = 'lap_pdf_originating_from_this',
        on_delete = models.CASCADE,
    )
    resulting_release = models.ForeignKey(
        CubeRelease,
        related_name = 'lap_pdf_resulting_in_this',
        on_delete = models.CASCADE,
    )

    class Meta:
        unique_together = ('original_release', 'resulting_release')


class Invite(models.Model):
    key_hash = models.CharField(max_length = 255, unique = True)
    email = models.CharField(max_length = 255)
    created_at = models.DateTimeField(default = now)
    issued_by = models.ForeignKey(
        get_user_model(),
        on_delete = models.CASCADE,
        related_name = 'issued_invitations',
    )
    claimed_by = models.ForeignKey(
        get_user_model(),
        on_delete = models.CASCADE,
        null = True,
        related_name = 'invite',
    )


class PasswordReset(TimestampedModel, models.Model):
    user = models.ForeignKey(get_user_model(), related_name = 'password_resets', on_delete = models.CASCADE)
    code = models.CharField(max_length = 127)
    claimed = models.BooleanField(default = False)

    @classmethod
    def create(cls, user: UserModel) -> PasswordReset:
        return cls.objects.create(
            user = user,
            code = ''.join(
                random.choice(string.ascii_letters)
                for _ in
                range(16)
            ),
        )


class ReleaseImageBundle(TimestampedModel, models.Model):
    class Target(Enum):
        COCKATRICE = 0

    url = models.CharField(max_length = 511)
    release = models.ForeignKey(
        CubeRelease,
        related_name = 'image_bundles',
        on_delete = models.CASCADE,
    )
    target = EnumField(Target)

    class Meta:
        unique_together = ('release', 'target')

# class EditPermission(TimestampedModel, models.Model):
#     user = models.ForeignKey(get_user_model(), related_name = 'edit_permissions', on_delete = models.CASCADE)
#
#     permission_for_content_type = models.ForeignKey(ContentType, on_delete = models.CASCADE)
#     permission_for_object_id = models.PositiveIntegerField()
#     permission_for = GenericForeignKey('permission_for_content_type', 'permission_for_object_id', )
#
#     class Meta:
#         unique_together = ('permission_for_content_type', 'permission_for_object_id')
