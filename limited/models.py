from __future__ import annotations

import datetime
import functools
import math
import string
import typing as t
import random
import operator

from enum import Enum

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.db import models, transaction

from mtgorp.models.collections.deck import Deck
from mtgorp.models.limited.boostergen import (
    GenerateBoosterException, BoosterKey, RARE_MYTHIC_SLOT, UNCOMMON_SLOT, COMMON_SLOT
)
from mtgorp.models.persistent.attributes.expansiontype import ExpansionType
from mtgorp.models.tournaments import tournaments as to
from mtgorp.models.tournaments.matches import MatchType

from magiccube.collections.cube import Cube
from magiccube.collections.infinites import Infinites

from typedmodels.models import TypedModel

from tournaments.models import Tournament, TournamentParticipant
from api.fields.orp import OrpField
from api.models import CubeRelease
from api.serialization.serializers import NameCubeReleaseSerializer
from utils.fields import EnumField, StringMapField, SerializeableField
from utils.methods import get_random_name
from utils.mixins import TimestampedModel
from resources.staticdb import db


PoolSpecificationOptions = t.Sequence[t.Mapping[str, t.Any]]


class PoolSpecification(models.Model):

    def get_boosters(self, player_amount: int) -> t.Iterable[t.List[Cube]]:
        players = [[] for _ in range(player_amount)]

        specifications = list(self.specifications.all())
        random.shuffle(specifications)

        for specification in sorted(specifications, key = lambda s: s.sequence_number):
            boosters = list(specification.get_boosters(player_amount * specification.amount))
            for _ in range(specification.amount):
                for player in players:
                    player.append(boosters.pop())

        return players

    def get_pools(self, player_amount: int) -> t.Iterable[Cube]:
        return (
            functools.reduce(operator.add, boosters)
            for boosters in
            self.get_boosters(player_amount)
        )

    def get_pool(self) -> Cube:
        return self.get_pools(1).__iter__().__next__()

    @classmethod
    def from_options(cls, options: PoolSpecificationOptions) -> PoolSpecification:
        pool_specification = PoolSpecification.objects.create()
        for idx, booster_options in enumerate(options):
            BoosterSpecification.from_options(booster_options, idx, pool_specification)
        return pool_specification


class BoosterSpecification(TypedModel):
    sequence_number = models.IntegerField(default = 0)
    amount = models.PositiveSmallIntegerField(default = 1)
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
            'sequence_number': self.sequence_number,
            'amount': self.amount,
            'type': self.__class__.__name__,
        }

    @classmethod
    def from_options(
        cls,
        options: t.Mapping[str: t.Any],
        sequence_number: int,
        pool_specification: PoolSpecification,
    ) -> BoosterSpecification:
        specification_type = cls._typedmodels_simple_registry[options['type']]
        specification = specification_type(
            sequence_number = sequence_number,
            amount = options['amount'],
            pool_specification = pool_specification,
            **specification_type.values_from_options(options)
        )
        specification.save()
        return specification

    @classmethod
    def values_from_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        return {}


class ExpansionBoosterSpecification(BoosterSpecification):
    expansion_code = models.CharField(max_length = 15, null = True)

    def get_boosters(self, amount: int) -> t.Iterator[Cube]:
        expansion = db.expansions[self.expansion_code]
        return (
            Cube(expansion.generate_booster())
            for _ in
            range(amount)
        )

    def serialize(self):
        return {
            **super().serialize(),
            'expansion_code': self.expansion_code,
        }

    @classmethod
    def values_from_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        return {
            'expansion_code': options['expansion_code'],
        }


class ChaosBoosterSpecification(BoosterSpecification):
    same = models.BooleanField(null = True)

    def get_boosters(self, amount: int) -> t.Iterator[Cube]:
        expansions = list(expansion for expansion in db.expansions.values() if expansion.expansion_type == ExpansionType.SET)
        if self.same:
            expansion = random.choice(expansions)
            return (
                Cube(expansion.generate_booster())
                for _ in
                range(amount)
            )
        for _ in range(amount):
            yield Cube(random.choice(expansions).generate_booster())

    def serialize(self):
        return {
            **super().serialize(),
            'same': self.same,
        }

    @classmethod
    def values_from_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        return {
            'same': options['same'],
        }


class AllCardsBoosterSpecification(BoosterSpecification):
    respect_printings = models.BooleanField(null = True)

    def get_boosters(self, amount: int) -> t.Iterator[Cube]:
        booster_map = BoosterKey(
            (RARE_MYTHIC_SLOT,)
            + (UNCOMMON_SLOT,) * 3
            + (COMMON_SLOT,) * 11
        ).get_booster_map(
            [
                printing
                for printing in
                db.printings.values()
                if printing.cardboard.latest_printing.expansion.expansion_type != ExpansionType.FUNNY
            ] if self.respect_printings else [
                cardboard.latest_printing
                for cardboard in
                db.cardboards.values()
                if cardboard.latest_printing.expansion.expansion_type != ExpansionType.FUNNY
            ]
        )
        return (
            Cube(booster_map.generate_booster())
            for _ in
            range(amount)
        )

    def serialize(self):
        return {
            **super().serialize(),
            'respect_printings': self.respect_printings,
        }

    @classmethod
    def values_from_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        return {
            'respect_printings': options['respect_printings'],
        }


class CubeBoosterSpecification(BoosterSpecification):
    release = models.ForeignKey(CubeRelease, on_delete = models.PROTECT, null = True)
    size = models.PositiveSmallIntegerField(null = True)
    allow_intersection = models.BooleanField(null = True, default = False)
    allow_repeat = models.BooleanField(null = True, default = False)
    scale = models.BooleanField(null = True, default = False)

    def get_boosters(self, amount: int) -> t.Iterator[Cube]:
        cube = self.release.cube

        if not self.allow_repeat:
            required_cube_size = self.size * (1 if self.allow_intersection else amount)
            if required_cube_size > len(self.release.cube):
                if self.scale:
                    try:
                        cube = cube.scale(required_cube_size)
                    except ValueError:
                        raise GenerateBoosterException('Not enough cubeables, cannot scale empty cube')
                else:
                    raise GenerateBoosterException(
                        f'not enough cubeables, needs {required_cube_size}, only has {len(self.release.cube)}'
                    )

        cubeables = list(cube.cubeables)

        if self.allow_repeat:
            for _ in range(amount):
                yield Cube(random.choices(cubeables, k = self.size))

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
            'scale': self.scale,
        }

    @classmethod
    def values_from_options(cls, options: t.Mapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        return {
            'release_id': options['release'],
            'size': options['size'],
            'allow_intersection': options['allow_intersection'],
            'allow_repeat': options['allow_repeat'],
            'scale': options['scale'],
        }


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
    open_decks = models.BooleanField(default = False)
    open_pools = models.BooleanField(default = False)
    pool_specification = models.ForeignKey(PoolSpecification, on_delete = models.CASCADE, related_name = 'sessions')
    infinites: Infinites = OrpField(model_type = Infinites)
    allow_cheating: bool = models.BooleanField(default = False)
    tournament_type: t.Type[to.Tournament] = StringMapField(to.Tournament.tournaments_map)
    tournament_config = models.JSONField()
    match_type: MatchType = SerializeableField(MatchType)
    tournament = models.OneToOneField(Tournament, on_delete = models.SET_NULL, related_name = 'limited_session', null = True)

    def create_tournament(self) -> Tournament:
        if self.tournament is not None:
            raise ValueError('tournament already created')
        if self.pools.filter(pool_decks__isnull=True).exists():
            raise ValueError('not all participants have submitted a deck')

        with transaction.atomic():
            tournament = Tournament.objects.create(
                name = self.name,
                tournament_type = self.tournament_type,
                tournament_config = self.tournament_config,
                match_type = self.match_type,
            )

            for pool in self.pools.all():
                TournamentParticipant.objects.create(
                    tournament = tournament,
                    deck = pool.pool_decks.order_by('created_at').last(),
                    player = pool.user,
                )

            self.tournament = tournament

            self.save(update_fields = ('tournament',))

            tournament.advance()

            return tournament

    def complete(self) -> None:
        if self.state == self.LimitedSessionState.FINISHED:
            return
        self.state = self.LimitedSessionState.FINISHED
        self.finished_at = datetime.datetime.now()
        self.save(update_fields = ('state', 'finished_at'))

    @property
    def expected_match_amount(self) -> int:
        number_players = self.pools.all().count()
        if number_players <= 1:
            return 0
        return int(math.factorial(number_players) / (2 * math.factorial(number_players - 2)))

    @property
    def decks_public(self) -> bool:
        return (
            self.state.value >= self.LimitedSessionState.FINISHED.value
            or (
                self.state == self.LimitedSessionState.PLAYING
                and self.open_decks
            )
        )

    @property
    def pools_public(self) -> bool:
        return self.open_pools or self.decks_public


class Pool(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete = models.CASCADE, related_name = 'sealed_pools')
    session = models.ForeignKey(LimitedSession, on_delete = models.CASCADE, related_name = 'pools')
    pool: Cube = OrpField(model_type = Cube)

    class Meta:
        unique_together = ('session', 'user')

    def can_view(self, user: AbstractUser) -> bool:
        return (
            user == self.user
            or self.session.pools_public
            or (
                (self.session.open_decks or self.session.open_pools)
                and isinstance(user, AbstractUser)
                and PoolDeck.objects.filter(pool__session = self.session, pool__user = user).exists()
            )
        )


class PoolDeck(models.Model):
    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    name = models.CharField(max_length = 255)
    deck = OrpField(Deck)
    pool = models.ForeignKey(Pool, on_delete = models.CASCADE, related_name = 'pool_decks')
    cheating = models.BooleanField(default = False)
    latest = models.BooleanField(default = True)

    class Meta(object):
        ordering = ('created_at',)

    def can_view(self, user: AbstractUser) -> bool:
        return (
            user == self.pool.user
            or self.pool.session.decks_public
            or (
                self.pool.session.open_decks
                and isinstance(user, AbstractUser)
                and PoolDeck.objects.filter(pool__session = self.pool.session, pool__user = user).exists()
            )
        )


class MatchResult(models.Model):
    created_at = models.DateTimeField(editable = False, blank = False, auto_now_add = True)
    draws = models.PositiveSmallIntegerField()
    session = models.ForeignKey(LimitedSession, on_delete = models.CASCADE, related_name = 'results')


class MatchPlayer(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete = models.PROTECT)
    wins = models.PositiveSmallIntegerField()
    match_result = models.ForeignKey(MatchResult, on_delete = models.CASCADE, related_name = 'players')

    class Meta:
        unique_together = ('user', 'match_result')


class PoolSharingCode(TimestampedModel):
    code = models.CharField(max_length = 63)
    pool = models.OneToOneField(Pool, on_delete = models.CASCADE, related_name = 'code')

    @classmethod
    def get_for_pool(cls, pool: Pool) -> PoolSharingCode:
        return cls.objects.get_or_create(
            pool = pool,
            defaults = {
                'code': ''.join(
                    random.choice(string.ascii_letters)
                    for _ in
                    range(63)
                ),
            }
        )[0]
