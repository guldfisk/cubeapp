from __future__ import annotations

import hashlib

from django.db import models
from django.utils.timezone import now
from django.contrib.auth import get_user_model

from magiccube.collections.laps import TrapCollection
from mocknames.generate import NameGenerator

from magiccube.collections.cube import Cube
from magiccube.update.cubeupdate import CubePatch as Patch
from magiccube.collections.nodecollection import NodeCollection, GroupMap

from api.fields.orp import OrpField

from utils.methods import get_random_name


class VersionedCube(models.Model):
    created_at = models.DateTimeField(default = now)
    name = models.CharField(max_length = 128)
    description = models.TextField()
    author = models.ForeignKey(
        get_user_model(),
        on_delete = models.CASCADE,
    )

    @property
    def latest_release(self) -> CubeRelease:
        return CubeRelease.objects.filter(versioned_cube = self).order_by('created_at').last()


class CubeRelease(models.Model):
    created_at = models.DateTimeField(default = now)
    checksum = models.CharField(max_length = 256)
    name = models.CharField(max_length = 64)
    intended_size = models.PositiveIntegerField()
    cube: Cube = OrpField(model_type = Cube)

    versioned_cube = models.ForeignKey(VersionedCube, on_delete = models.CASCADE, related_name = 'releases')

    class Meta:
        ordering = ('-created_at',)

    @classmethod
    def create(cls, cube: Cube, versioned_cube: VersionedCube) -> CubeRelease:
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
            intended_size = 360,
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
        related_name = 'deltas',
    )
    forked_from = models.ForeignKey(
        'CubePatch',
        related_name = 'forks',
        null = True,
        on_delete = models.SET_NULL,
    )


class DistributionPossibility(models.Model):
    created_at = models.DateTimeField(default = now)
    trap_collection = OrpField(model_type = TrapCollection)
    pdf_url = models.CharField(max_length = 511, null = True)
    patch_checksum = models.CharField(max_length = 255)
    distribution_checksum = models.CharField(max_length = 255)
    fitness = models.FloatField()

    patch = models.ForeignKey(
        CubePatch,
        on_delete = models.CASCADE,
    )

    class Meta:
        unique_together = ('patch', 'patch_checksum', 'distribution_checksum')


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
