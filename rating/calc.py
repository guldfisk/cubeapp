import functools
import itertools
import math
import operator
import random
import typing as t
from collections import defaultdict

import numpy as np

from scipy import stats

from django.db.models import Count, F

from mtgorp.models.formats.format import LimitedSideboard
from mtgorp.models.interfaces import Cardboard, Printing

from magiccube.collections.cubeable import CardboardCubeable
from magiccube.laps.traps.trap import CardboardTrap, IntentionType
from magiccube.laps.traps.tree.printingtree import CardboardNodeChild, NodeAny, NodeAll, CardboardNode, PrintingNode
from magiccube.tools.cube_difference import cube_difference

from api.models import CubeRelease
from limited.models import CubeBoosterSpecification, PoolDeck
from rating import models
from rating.values import AVERAGE_RATING


Number = t.Union[int, float]


def ci_lower_bound(pos: Number, n: Number, confidence: Number = .95) -> float:
    if n == 0:
        return 0

    z = stats.norm.cdf(1 - (1 - confidence) / 2)
    phat = pos / n
    return (phat + z * z / (2 * n) - z * math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)) / (1 + z * z / n)


def distribute_value_weighted(value: Number, weights: t.Sequence[Number]) -> t.Sequence[float]:
    summed = sum(weights)
    if summed == 0:
        return [value / len(weights) for _ in weights]
    return [value * w / summed for w in weights]


def _update_occurrences(
    traps: t.Iterable[CardboardTrap],
    occurrences: t.MutableMapping[CardboardNodeChild, t.Set[CardboardNodeChild]],
):
    for trap in traps:
        for child in trap.node.children:
            other = set(trap.node.children.distinct_elements())
            try:
                occurrences[child].intersection_update(other)
            except KeyError:
                occurrences[child] = other

    for child, others in occurrences.items():
        for other in others - {child}:
            others.intersection_update(occurrences[other])
        if len(others) == 1:
            others.clear()


def _get_perfect_correlations(
    traps: t.Iterable[t.Iterable[CardboardTrap]],
) -> t.AbstractSet[t.FrozenSet[CardboardNodeChild]]:
    occurrences = {}
    for _traps in traps:
        _update_occurrences(_traps, occurrences)
        if not any(occurrences.values()):
            break

    return {
        frozenset(v)
        for v in
        occurrences.values()
        if v
    }


class RegressionError(Exception):
    pass


def rating_maps_to_matrix(
    rating_maps: t.Sequence[models.RatingMap],
) -> t.Tuple[
    t.List[t.Union[CardboardNodeChild, t.FrozenSet[CardboardNodeChild]]],
    t.List[models.CardboardCubeableRating],
    np.ndarray,
    np.ndarray,
]:
    nodes = {
        (
            node.children.__iter__().__next__()
            if isinstance(node, NodeAll) and len(node.children) == 1 else
            node
        )
        for node in
        (
            node.node.as_cardboards
            for node in
            itertools.chain(
                *(
                    rating_map.release.constrained_nodes.constrained_nodes.nodes.distinct_elements()
                    for rating_map in
                    rating_maps
                )
            )
        )
    }

    if not nodes:
        raise RegressionError('No nodes')

    ratings = [
        [
            rating
            for rating in
            rating_map.ratings.all()
            if isinstance(rating.cardboard_cubeable, CardboardTrap) and rating.cardboard_cubeable.intention_type == IntentionType.GARBAGE
        ]
        for rating_map in
        rating_maps
    ]

    perfect_correlations = _get_perfect_correlations(
        [
            [rating.cardboard_cubeable for rating in release]
            for release in
            ratings
        ]
    )

    for correlated in perfect_correlations:
        nodes -= correlated

    nodes = list(nodes) + list(perfect_correlations)
    ratings = functools.reduce(operator.add, ratings)

    if not len(ratings) > len(nodes):
        raise RegressionError('Must have more rated traps than nodes')

    ratings_vector = np.asarray([rating.rating for rating in ratings])

    matrix = [
        (
            [1.] + [
            abs(
                int(
                    node >= rating.cardboard_cubeable.node.children.distinct_elements()
                    if isinstance(node, frozenset) else
                    node in rating.cardboard_cubeable.node.children
                ) - (random.random() / 1000)
            )
            for node in
            nodes
        ]
        )
        for rating in
        ratings
    ]

    return nodes, ratings, np.asarray(matrix), ratings_vector


def get_node_weights(
    rating_maps: t.Sequence[models.RatingMap],
) -> t.Iterator[t.Tuple[CardboardNodeChild, float]]:
    nodes, ratings, matrix, ratings_vector = rating_maps_to_matrix(rating_maps)

    weighted = np.matmul(
        np.matmul(
            np.linalg.inv(np.matmul(matrix.transpose(), matrix)),
            matrix.transpose(),
        ),
        ratings_vector,
    )
    for r, node in zip(weighted, nodes):
        if isinstance(node, frozenset):
            for child in node:
                yield child, r / len(node)
        else:
            yield node, r


def get_previous_ratings_map_by_regression(
    previous_releases: t.Iterable[t.Tuple[CubeRelease, float]],
    previous_rating_map: models.RatingMap,
) -> t.Tuple[t.Mapping[CardboardCubeable, int], t.Mapping[CardboardNodeChild, float]]:
    previous_release_ids = {release.id for release, _ in previous_releases}
    rating_maps = [previous_rating_map]
    while rating_maps[-1].parent_id is not None:
        parent = rating_maps[-1].parent
        if parent.release_id in previous_release_ids:
            rating_maps.append(parent)
        else:
            break

    return (
        {
            rating.cardboard_cubeable: rating.rating
            for rating in
            previous_rating_map.ratings.all()
        },
        {
            child: rating
            for child, rating in
            get_node_weights(rating_maps)
        },
    )


def _get_node_conversion_rate(node: CardboardNodeChild, conversion_rate_map: t.Mapping[Cardboard, float]) -> float:
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
