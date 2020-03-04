import random
import typing as t
from enum import Enum

from django.contrib.auth import get_user_model
from django.db import models

from api.fields.orp import OrpField
from api.models import CubeRelease
from api.serialization.serializers import NameCubeReleaseSerializer
from magiccube.collections.cube import Cube
from mtgorp.models.collections.deck import Deck
from typedmodels.models import TypedModel
from utils.fields import EnumField
from utils.methods import get_random_name
from utils.mixins import TimestampedModel


class GenerateBoostersException(Exception):
    pass


class PoolSpecification(models.Model):

    def get_boosters(self, player_amount: int) -> t.Iterable[t.List[Cube]]:
        players = [[] for _ in range(player_amount)]
        for specification in self.specifications.all().order_by('sequence_number'):
            for player, booster in zip(players, specification.get_boosters(player_amount)):
                player.append(booster)
        return players


class BoosterSpecification(TypedModel):
    sequence_number = models.IntegerField()
    pool_specification = models.ForeignKey(
        PoolSpecification,
        related_name = 'specifications',
        on_delete = models.DO_NOTHING,
    )

    class Meta:
        ordering = ('sequence_number',)

    def get_boosters(self, amount: int) -> t.Iterator[Cube]:
        pass

    def serialize(self):
        return {
            'id': self.id,
            'type': self.__class__.__name__,
        }

    @classmethod
    def deserialize(cls, values):
        return cls._typedmodels_simple_registry[values['type']].deserialize(values)


class ExpansionBoosterSpecification(BoosterSpecification):
    expansion_code = models.CharField(max_length = 15, null = True)

    def serialize(self):
        return {
            **super().serialize(),
            'expansion_code': self.expansion_code,
        }

    @classmethod
    def deserialize(cls, values):
        return cls(
            expansion_code = values['expansion_code'],
        )


class AllCardsRespectRarityBoosterSpecification(BoosterSpecification):
    pass


class CubeBoosterSpecification(BoosterSpecification):
    release = models.ForeignKey(CubeRelease, on_delete = models.PROTECT, null = True)
    size = models.PositiveSmallIntegerField(null = True)
    allow_intersection = models.BooleanField(null = True, default = False)
    allow_repeat = models.BooleanField(null = True, default = False)

    def get_boosters(self, amount: int) -> t.Iterator[Cube]:
        if not self.allow_repeat:
            required_cube_size = self.size * (1 if self.allow_intersection else amount)
            if required_cube_size > len(self.release.cube):
                raise GenerateBoostersException(
                    f'not enough cubeables, needs {required_cube_size}, only has {len(self.release.cube)}'
                )

        cubeables = list(self.release.cube.cubeables)

        if self.allow_repeat:
            for _ in range(amount):
                yield Cube(random.choice(cubeables, k = self.size))

        elif self.allow_intersection:
            for _ in range(amount):
                yield Cube(random.sample(cubeables, self.size))

        else:
            random.shuffle(cubeables)
            for i in range(amount):
                yield Cube(cubeables[i * self.size: (i + 1) * self.size])

    def serialize(self):
        return {
            **super().serialize(),
            'release': NameCubeReleaseSerializer(self.release).data,
            'size': self.size,
            'allow_intersection': self.allow_intersection,
            'allow_repeat': self.allow_repeat,
        }

    @classmethod
    def deserialize(cls, values):
        return cls(
            size = values['size'],
            allow_intersection = values['allow_intersection'],
            allow_repeat = values['allow_repeat'],
        )


class LimitedSession(models.Model):
    class LimitedSessionState(Enum):
        DECK_BUILDING = 0
        PLAYING = 1
        FINISHED = 2

    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    playing_at = models.DateTimeField(null = True)
    finished_at = models.DateTimeField(null = True)
    name = models.CharField(max_length = 255, default = get_random_name)
    state = EnumField(LimitedSessionState, default = LimitedSessionState.DECK_BUILDING)
    format = models.CharField(max_length = 255)
    game_type = models.CharField(max_length = 255)
    open_decks = models.BooleanField()
    pool_specification = models.ForeignKey(PoolSpecification, on_delete = models.CASCADE, related_name = 'sessions')


class Pool(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete = models.CASCADE, related_name = 'sealed_pools')
    session = models.ForeignKey(LimitedSession, on_delete = models.CASCADE, related_name = 'pools')
    pool: Cube = OrpField(model_type = Cube)

    class Meta:
        unique_together = ('session', 'user')


class PoolDeck(models.Model):
    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    name = models.CharField(max_length = 255)
    deck = OrpField(Deck)
    pool = models.ForeignKey(Pool, on_delete = models.CASCADE, related_name = 'decks')
