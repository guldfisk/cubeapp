from __future__ import annotations

import hashlib

from django.db import models
from django.utils.timezone import now
from django.contrib.auth import get_user_model

from mocknames.generate import NameGenerator
from mtgorp.models.serilization.strategies.jsonid import JsonId

from magiccube.collections.cube import Cube

from resources.staticdb import db


class VersionedCube(models.Model):
    created_at = models.DateTimeField(default=now)
    name = models.CharField(max_length=128)
    description = models.TextField()
    author = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
    )

    @property
    def latest_release(self) -> CubeRelease:
        return CubeRelease.objects.filter(versioned_cube=self).order_by('created_at').last()


class CubeRelease(models.Model):
    created_at = models.DateTimeField(default=now)
    checksum = models.CharField(max_length=256)
    name = models.CharField(max_length=64)
    intended_size = models.PositiveIntegerField()
    cube_content = models.TextField()

    versioned_cube = models.ForeignKey(VersionedCube, on_delete=models.CASCADE, related_name='releases')

    class Meta:
        ordering = ('-created_at',)

    @property
    def cube(self) -> Cube:
        return JsonId(db).deserialize(Cube, self.cube_content)

    @classmethod
    def create(cls, cube: Cube, versioned_cube: VersionedCube) -> CubeRelease:
        return cls.objects.create(
            cube_content=JsonId.serialize(cube),
            checksum=cube.persistent_hash(),
            name=NameGenerator().get_name(
                int(
                    hashlib.sha1(
                        cube.persistent_hash().encode('ASCII')
                    ).hexdigest(),
                    16,
                )
            ),
            versioned_cube=versioned_cube,
            intended_size=360,
        )


class ConstrainedNodes(models.Model):
    constrained_nodes_content = models.TextField()
    release = models.OneToOneField(
        CubeRelease,
        related_name = 'constrained_nodes',
        on_delete = models.CASCADE,
    )


class CubePatch(models.Model):
    created_at = models.DateTimeField(default=now)
    description = models.TextField()
    content = models.TextField()

    author = models.ForeignKey(
        get_user_model(),
        on_delete = models.CASCADE,
    )
    versioned_cube  =  models.ForeignKey(
        VersionedCube,
        on_delete = models.CASCADE,
        related_name = 'deltas',
    )


class Invite(models.Model):
    key_hash = models.CharField(max_length = 255, unique=True)
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