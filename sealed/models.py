from __future__ import annotations

import random
import typing as t

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.db import models

from magiccube.collections.cube import Cube

from api.fields.orp import OrpField
from api.models import CubeRelease


class GenerateSealedPoolException(Exception):
    pass


class SealedSession(models.Model):
    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    pool_size = models.PositiveSmallIntegerField()
    release = models.ForeignKey(CubeRelease, on_delete = models.CASCADE, related_name = 'sealed_sessions')

    @classmethod
    def generate(
        cls,
        release: CubeRelease,
        users: t.Iterable[t.Tuple[AbstractUser, str]],
        pool_size: int,
    ) -> SealedSession:
        users = list(users)
        if len(users) * pool_size > len(release.cube):
            raise GenerateSealedPoolException('not enough cubeables')

        cubeables = list(release.cube.cubeables)
        random.shuffle(cubeables)

        sealed_session = cls.objects.create(
            release = release,
            pool_size = pool_size,
        )

        for i, (user, key) in enumerate(users):
            Pool.objects.create(
                user = user,
                pool = Cube(cubeables[i * pool_size: (i + 1) * pool_size]),
                key = key,
            )

        return sealed_session


class Pool(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete = models.CASCADE, related_name = 'sealed_pools')
    pool: Cube = OrpField(model_type = Cube)
    key = models.CharField(max_length = 63)
