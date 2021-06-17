from __future__ import annotations

import dataclasses
import functools
import typing as t
from collections import defaultdict

import numpy as np
from lazy_property import LazyProperty
from scipy.stats import beta

from django.db.models import Count, F

from mtgorp.models.formats.format import LimitedSideboard
from mtgorp.models.interfaces import Cardboard, Printing

from magiccube.collections.cubeable import CardboardCubeable
from magiccube.laps.traps.trap import CardboardTrap, IntentionType
from magiccube.laps.traps.tree.printingtree import CardboardNodeChild, NodeAny, CardboardNode, PrintingNode
from magiccube.tools.cube_difference import cube_difference

from api.models import CubeRelease
from limited.models import CubeBoosterSpecification, PoolDeck
from rating import models
from rating.values import AVERAGE_RATING
from tournaments.models import ScheduledMatch


Number = t.Union[int, float]
CVS = t.Mapping[Cardboard, float]
CVSI = t.Mapping[Cardboard, int]


def ci_lower_bound(successes: Number, occurrences: Number) -> float:
    return beta.interval(.98, successes + 1, occurrences - successes + 1)[0]


def distribute_value_weighted(value: Number, weights: t.Sequence[Number]) -> t.Sequence[float]:
    summed = sum(weights)
    if summed == 0:
        return [value / len(weights) for _ in weights]
    return [value * w / summed for w in weights]


def _get_node_conversion_rate(node: CardboardNodeChild, conversion_rate_map: CVS) -> float:
    return (
        conversion_rate_map.get(node, 0.)
        if isinstance(node, Cardboard) else
        (
            min(
                sum(
                    _get_node_conversion_rate(child, conversion_rate_map)
                    for child in
                    node
                ),
                1.,
            )
            if isinstance(node, NodeAny) else
            max(
                _get_node_conversion_rate(child, conversion_rate_map)
                for child in
                node
            )
        )
    )


def _wrap_default_float(f: t.Callable[[t.Any], CVS]) -> t.Callable[[t.Any], CVS]:
    @functools.wraps(f)
    def _f(i):
        return defaultdict(float, f(i))

    return _f


@dataclasses.dataclass
class CardboardStatsMaps(object):
    pool_occurrences: CVS
    real_pool_occurrences: CVSI
    maindeck_occurrences: CVS
    real_maindeck_occurrences: CVSI
    sideboard_occurrences: CVS
    real_sideboard_occurrences: CVSI
    maindeck_matches: CVS
    real_maindeck_matches: CVSI
    sideboard_matches: CVS
    real_sideboard_matches: CVSI
    maindeck_wins: CVS
    real_maindeck_wins: CVSI
    sideboard_wins: CVS
    real_sideboard_wins: CVSI

    @LazyProperty
    @_wrap_default_float
    def deck_occurrences(self) -> CVS:
        return {
            cardboard: self.maindeck_occurrences[cardboard] + self.sideboard_occurrences[cardboard]
            for cardboard in
            self.maindeck_occurrences.keys() | self.sideboard_occurrences.keys()
        }

    @LazyProperty
    @_wrap_default_float
    def real_deck_occurrences(self) -> CVSI:
        return {
            cardboard: self.real_maindeck_occurrences[cardboard] + self.real_sideboard_occurrences[cardboard]
            for cardboard in
            self.real_maindeck_occurrences.keys() | self.real_sideboard_occurrences.keys()
        }

    @LazyProperty
    @_wrap_default_float
    def deck_conversion_rates(self) -> CVS:
        return {
            cardboard: self.deck_occurrences[cardboard] / occurrences if occurrences else .0
            for cardboard, occurrences in
            self.pool_occurrences.items()
        }

    @LazyProperty
    @_wrap_default_float
    def ci_deck_conversion_rates(self) -> CVS:
        return {
            cardboard: ci_lower_bound(
                self.deck_occurrences[cardboard],
                occurrences,
            )
            for cardboard, occurrences in
            self.pool_occurrences.items()
        }

    @LazyProperty
    @_wrap_default_float
    def maindeck_conversion_rates(self) -> CVS:
        return {
            cardboard: self.maindeck_occurrences[cardboard] / occurrences if occurrences else .0
            for cardboard, occurrences in
            self.pool_occurrences.items()
        }

    @LazyProperty
    @_wrap_default_float
    def ci_maindeck_conversion_rates(self) -> CVS:
        return {
            cardboard: ci_lower_bound(
                self.maindeck_occurrences[cardboard],
                occurrences,
            )
            for cardboard, occurrences in
            self.pool_occurrences.items()
        }

    @LazyProperty
    @_wrap_default_float
    def sideboard_conversion_rates(self) -> CVS:
        return {
            cardboard: self.sideboard_occurrences[cardboard] / occurrences if occurrences else .0
            for cardboard, occurrences in
            self.pool_occurrences.items()
        }

    @LazyProperty
    @_wrap_default_float
    def ci_sideboard_conversion_rates(self) -> CVS:
        return {
            cardboard: ci_lower_bound(
                self.sideboard_occurrences[cardboard],
                occurrences,
            )
            for cardboard, occurrences in
            self.pool_occurrences.items()
        }

    @LazyProperty
    @_wrap_default_float
    def matches(self) -> CVS:
        return {
            cardboard: self.maindeck_matches[cardboard] + self.sideboard_matches[cardboard]
            for cardboard in
            self.maindeck_matches.keys() | self.sideboard_matches.keys()
        }

    @LazyProperty
    @_wrap_default_float
    def real_matches(self) -> CVSI:
        return {
            cardboard: self.real_maindeck_matches[cardboard] + self.real_sideboard_matches[cardboard]
            for cardboard in
            self.real_maindeck_matches.keys() | self.real_sideboard_matches.keys()
        }

    @LazyProperty
    @_wrap_default_float
    def wins(self) -> CVS:
        return {
            cardboard: self.maindeck_wins[cardboard] + self.sideboard_wins[cardboard]
            for cardboard in
            self.maindeck_wins.keys() | self.sideboard_wins.keys()
        }

    @LazyProperty
    @_wrap_default_float
    def real_wins(self) -> CVSI:
        return {
            cardboard: self.real_maindeck_wins[cardboard] + self.real_sideboard_wins[cardboard]
            for cardboard in
            self.real_maindeck_wins.keys() | self.real_sideboard_wins.keys()
        }

    @LazyProperty
    @_wrap_default_float
    def win_rates(self) -> CVS:
        return {
            cardboard: self.wins[cardboard] / matches if matches else .0
            for cardboard, matches in
            self.matches.items()
        }

    @LazyProperty
    @_wrap_default_float
    def ci_win_rates(self) -> CVS:
        return {
            cardboard: ci_lower_bound(
                self.wins[cardboard],
                matches,
            )
            for cardboard, matches in
            self.matches.items()
        }

    @LazyProperty
    @_wrap_default_float
    def maindeck_win_rates(self) -> CVS:
        return {
            cardboard: self.maindeck_wins[cardboard] / matches if matches else .0
            for cardboard, matches in
            self.maindeck_matches.items()
        }

    @LazyProperty
    @_wrap_default_float
    def ci_maindeck_win_rates(self) -> CVS:
        return {
            cardboard: ci_lower_bound(
                self.maindeck_wins[cardboard],
                matches
            )
            for cardboard, matches in
            self.maindeck_matches.items()
        }

    @LazyProperty
    @_wrap_default_float
    def sideboard_win_rates(self) -> CVS:
        return {
            cardboard: self.sideboard_wins[cardboard] / matches if matches else .0
            for cardboard, matches in
            self.sideboard_matches.items()
        }

    @LazyProperty
    @_wrap_default_float
    def ci_sideboard_win_rates(self) -> CVS:
        return {
            cardboard: ci_lower_bound(
                self.sideboard_wins[cardboard],
                matches
            )
            for cardboard, matches in
            self.sideboard_matches.items()
        }


class CardboardMap(object):

    def __init__(self):
        self.real: t.MutableMapping[Cardboard, int] = defaultdict(int)
        self.weighted: t.MutableMapping[Cardboard, float] = defaultdict(float)

    def add(self, cardboard: Cardboard, weight: float) -> None:
        self.real[cardboard] += 1
        self.weighted[cardboard] += weight


def calculate_cardboard_stats(
    weighted_releases: t.Iterable[t.Tuple[CubeRelease, float]],
) -> CardboardStatsMaps:
    previous_releases_difference_map: t.Mapping[int, float] = {r.id: d for r, d in weighted_releases}

    pool_occurrences = CardboardMap()
    maindeck_deck_conversions = CardboardMap()
    sideboard_deck_conversions = CardboardMap()

    for pool_deck in PoolDeck.objects.annotate(
        specifications_count = Count(
            'pool__session__pool_specification__specifications'
        ),
        release_id = F('pool__session__pool_specification__specifications__release_id'),
    ).filter(
        specifications_count = 1,
        pool__session__format = LimitedSideboard.name,
        pool__session__pool_specification__specifications__type = CubeBoosterSpecification._typedmodels_type,
        pool__session__pool_specification__specifications__release__in = previous_releases_difference_map.keys(),
        pool__session__pool_specification__specifications__allow_intersection = False,
        pool__session__pool_specification__specifications__allow_repeat = False,
    ).select_related('pool'):
        difference = 1 - previous_releases_difference_map.get(pool_deck.release_id, 0.)
        cardboard_deck = pool_deck.deck.as_cardboards
        for cardboard in cardboard_deck.maindeck.distinct_elements():
            maindeck_deck_conversions.add(cardboard, difference)
        for cardboard in cardboard_deck.sideboard.distinct_elements():
            sideboard_deck_conversions.add(cardboard, difference)
        for cardboard in set(pool_deck.pool.pool.as_cardboards.all_models):
            pool_occurrences.add(cardboard, difference)

    maindeck_matches_count_map = CardboardMap()
    sideboard_matches_count_map = CardboardMap()
    maindeck_wins_count_map = CardboardMap()
    sideboard_wins_count_map = CardboardMap()

    for scheduled_match in ScheduledMatch.objects.annotate(
        specifications_count = Count(
            'round__tournament__limited_session__pool_specification__specifications__release_id'
        ),
        release_id = F('round__tournament__limited_session__pool_specification__specifications__release_id'),
    ).filter(
        specifications_count = 1,
        result__isnull = False,
        round__tournament__limited_session__pool_specification__specifications__type = CubeBoosterSpecification._typedmodels_type,
        round__tournament__limited_session__pool_specification__specifications__release__in = previous_releases_difference_map.keys(),
        round__tournament__limited_session__pool_specification__specifications__allow_intersection = False,
        round__tournament__limited_session__pool_specification__specifications__allow_repeat = False,
    ).prefetch_related(
        'seats',
        'seats__participant__deck',
        'seats__result',
    ):
        difference = 1 - previous_releases_difference_map.get(scheduled_match.release_id, 0.)

        winners = scheduled_match.winners
        for seat in scheduled_match.seats.all():
            cardboard_deck = seat.participant.deck.deck.as_cardboards
            for cardboard in cardboard_deck.maindeck.distinct_elements():
                maindeck_matches_count_map.add(cardboard, difference)
            for cardboard in cardboard_deck.sideboard.distinct_elements():
                sideboard_matches_count_map.add(cardboard, difference)

            if seat.participant in winners:
                for cardboard in cardboard_deck.maindeck.distinct_elements():
                    maindeck_wins_count_map.add(cardboard, difference / len(winners))
                for cardboard in cardboard_deck.sideboard.distinct_elements():
                    sideboard_wins_count_map.add(cardboard, difference / len(winners))

    return CardboardStatsMaps(
        pool_occurrences = pool_occurrences.weighted,
        real_pool_occurrences = pool_occurrences.real,
        maindeck_occurrences = maindeck_deck_conversions.weighted,
        real_maindeck_occurrences = maindeck_deck_conversions.real,
        sideboard_occurrences = sideboard_deck_conversions.weighted,
        real_sideboard_occurrences = sideboard_deck_conversions.real,
        maindeck_matches = maindeck_matches_count_map.weighted,
        real_maindeck_matches = maindeck_matches_count_map.real,
        sideboard_matches = sideboard_matches_count_map.weighted,
        real_sideboard_matches = sideboard_matches_count_map.real,
        maindeck_wins = maindeck_wins_count_map.weighted,
        real_maindeck_wins = maindeck_wins_count_map.real,
        sideboard_wins = sideboard_wins_count_map.weighted,
        real_sideboard_wins = sideboard_wins_count_map.real,
    )


def get_previous_ratings_map_by_conversion_rate(
    previous_releases: t.Iterable[t.Tuple[CubeRelease, float]],
    previous_rating_map: models.RatingMap,
) -> t.Tuple[t.Mapping[CardboardCubeable, int], t.Mapping[CardboardNodeChild, int]]:
    previous_releases_difference_map: t.Mapping[int, float] = {r.id: d for r, d in previous_releases}

    pool_occurrences: t.MutableMapping[Cardboard, float] = defaultdict(float)
    deck_conversions: t.MutableMapping[Cardboard, float] = defaultdict(float)

    for pool_deck in PoolDeck.objects.annotate(
        specifications_count = Count(
            'pool__session__pool_specification__specifications'
        ),
        release_id = F('pool__session__pool_specification__specifications__release_id'),
    ).filter(
        specifications_count = 1,
        pool__session__format = LimitedSideboard.name,
        pool__session__pool_specification__specifications__type = CubeBoosterSpecification._typedmodels_type,
        pool__session__pool_specification__specifications__release__in = previous_releases_difference_map.keys(),
        pool__session__pool_specification__specifications__allow_intersection = False,
        pool__session__pool_specification__specifications__allow_repeat = False,
    ).select_related('pool'):
        difference = 1 - previous_releases_difference_map.get(pool_deck.release_id, 0.)
        for printing in pool_deck.deck.seventy_five:
            deck_conversions[printing.cardboard] += difference
        for cardboard in pool_deck.pool.pool.as_cardboards.all_models:
            pool_occurrences[cardboard] += difference

    conversion_rate_map = {
        cardboard: ci_lower_bound(deck_conversions[cardboard], p_occurrences)
        for cardboard, p_occurrences in
        pool_occurrences.items()
    }

    previous_rating_map = {
        rating.cardboard_cubeable: rating.rating
        for rating in
        previous_rating_map.ratings.all()
    }
    previous_ratings_node_map: t.DefaultDict[CardboardNodeChild, t.List[float]] = defaultdict(list)

    for cardboard_cubeable, rating in previous_rating_map.items():
        if isinstance(cardboard_cubeable, CardboardTrap) and cardboard_cubeable.intention_type == IntentionType.GARBAGE:
            node_conversion_rates = [
                (
                    node,
                    _get_node_conversion_rate(node, conversion_rate_map),
                )
                for node in
                cardboard_cubeable.node.children
            ]

            for node, weighted_rating in zip(
                (n for n, _ in node_conversion_rates),
                distribute_value_weighted(rating, [v for _, v in node_conversion_rates]),
            ):
                previous_ratings_node_map[node].append(weighted_rating)

    return previous_rating_map, {
        k: int(np.average(v))
        for k, v in
        previous_ratings_node_map.items()
    }


def get_previous_releases_for_release(release: CubeRelease, difference_cut_off: float = .6) -> t.Sequence[t.Tuple[CubeRelease, float]]:
    meta = release.as_meta_cube()
    previous_releases: t.List[t.Tuple[CubeRelease, float]] = []

    for previous_release in release.all_upstream_releases():
        difference = cube_difference(previous_release.as_meta_cube(), meta)
        if difference >= difference_cut_off:
            break
        previous_releases.append((previous_release, difference))

    return previous_releases


def get_node_rating_components(
    release: CubeRelease,
    previous_ratings_node_map: t.Mapping[CardboardNodeChild, int],
    rating_map: models.RatingMap,
) -> t.Sequence[models.NodeRatingComponent]:
    node_weights = {
        (
            node.node.children.__iter__().__next__().cardboard
            if len(node.node.children) == 1 else
            node.node.as_cardboards
        ): node.value
        for node in
        release.constrained_nodes.constrained_nodes
    }

    node_example_map: t.MutableMapping[CardboardNode, t.Tuple[PrintingNode, int]] = {}

    for trap in release.cube.garbage_traps:
        for node in trap.node.children:
            as_cardboards = node.cardboard if isinstance(node, Printing) else node.as_cardboards
            node_example_map[as_cardboards] = (
                node,
                previous_ratings_node_map.get(
                    as_cardboards,
                    AVERAGE_RATING / len(trap.node.children),
                ),
            )

    node_rating_components = []

    for node, (example, rating_component) in node_example_map.items():
        node_rating_components.append(
            models.NodeRatingComponent(
                rating_map = rating_map,
                node = node,
                node_id = node.id if isinstance(node, Cardboard) else node.persistent_hash(),
                example_node = example,
                rating_component = rating_component,
                weight = node_weights.get(node, 0),
            )
        )

    return node_rating_components
