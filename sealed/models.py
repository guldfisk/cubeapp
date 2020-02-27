from __future__ import annotations

import random
import typing as t
from enum import Enum

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.db import models

from mtgorp.models.collections.deck import Deck
from mtgorp.models.formats.format import Format

from magiccube.collections.cube import Cube

from api.fields.orp import OrpField
from api.models import CubeRelease

from utils.fields import EnumField
from utils.methods import get_random_name


class GenerateSealedPoolException(Exception):
    pass


class SealedSession(models.Model):
    class SealedSessionState(Enum):
        DECK_BUILDING = 0
        PLAYING = 1
        FINISHED = 2

    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    playing_at = models.DateTimeField(null = True)
    finished_at = models.DateTimeField(null = True)
    name = models.CharField(max_length = 255, default = get_random_name)
    state = EnumField(SealedSessionState, default = SealedSessionState.DECK_BUILDING)
    pool_size = models.PositiveSmallIntegerField()
    release = models.ForeignKey(CubeRelease, on_delete = models.CASCADE, related_name = 'sealed_sessions')
    format = models.CharField(max_length = 255)
    open_decks = models.BooleanField()
    allow_pool_intersection = models.BooleanField()

    @classmethod
    def generate(
        cls,
        release: CubeRelease,
        users: t.Iterable[AbstractUser],
        pool_size: int,
        game_format: Format,
        open_decks: bool = True,
        allow_pool_intersection: bool = False,
    ) -> SealedSession:
        users = list(users)

        required_cube_size = pool_size if allow_pool_intersection else len(users) * pool_size

        if required_cube_size > len(release.cube):
            raise GenerateSealedPoolException(
                f'not enough cubeables, needs {required_cube_size}, only has {len(release.cube)}'
            )

        sealed_session = cls.objects.create(
            release = release,
            pool_size = pool_size,
            format = game_format.name,
            open_decks = open_decks,
            allow_pool_intersection = allow_pool_intersection,
        )

        cubeables = list(release.cube.cubeables)

        if allow_pool_intersection:
            for user in users:
                Pool.objects.create(
                    user = user,
                    pool = Cube(random.sample(cubeables, pool_size)),
                    session = sealed_session,
                )

        else:
            random.shuffle(cubeables)

            for i, user in enumerate(users):
                Pool.objects.create(
                    user = user,
                    pool = Cube(cubeables[i * pool_size: (i + 1) * pool_size]),
                    session = sealed_session,
                )

        return sealed_session


class Pool(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete = models.CASCADE, related_name = 'sealed_pools')
    session = models.ForeignKey(SealedSession, on_delete = models.CASCADE, related_name = 'pools')
    pool: Cube = OrpField(model_type = Cube)

    class Meta:
        unique_together = ('session', 'user')


class PoolDeck(models.Model):
    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    name = models.CharField(max_length = 255)
    deck = OrpField(Deck)
    pool = models.ForeignKey(Pool, on_delete = models.CASCADE, related_name = 'decks')
