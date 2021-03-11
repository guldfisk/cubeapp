import itertools
import typing as t
from collections import defaultdict

from numpy import average

from celery import shared_task

from django.db import transaction
from django.db.models import Count, F

from mtgorp.models.formats.format import LimitedSideboard
from mtgorp.models.interfaces import Cardboard

from magiccube.collections.cubeable import cardboardize
from magiccube.laps.traps.trap import CardboardTrap, IntentionType
from magiccube.laps.traps.tree.printingtree import CardboardNodeChild
from magiccube.tools.cube_difference import cube_difference

from elo.utils import rescale_eloeds, adjust_eloeds

from api.models import CubeRelease
from draft.models import DraftSession, DraftPick
from limited.models import CubeBoosterSpecification, PoolDeck

from rating import models
from rating.values import AVERAGE_RATING


def distribute_value_weighted(value: t.Union[int, float], weights: t.Sequence[float]) -> t.Sequence[float]:
    summed = sum(weights)
    if summed == 0:
        return [value / len(weights) for _ in weights]
    return [value * w / summed for w in weights]


@shared_task()
@transaction.atomic()
def generate_ratings_map_for_release(release_id: int) -> None:
    release = CubeRelease.objects.get(pk = release_id)

    release_meta = release.as_meta_cube()
    cardboard_cube = release.cube.as_cardboards

    previous_releases: t.List[t.Tuple[CubeRelease, float]] = []

    for previous_release in CubeRelease.objects.filter(
        versioned_cube = release.versioned_cube,
        created_at__lt = release.created_at,
    ).order_by('-created_at'):
        difference = cube_difference(previous_release.as_meta_cube(), release_meta)
        if difference >= .6:
            break
        previous_releases.append((previous_release, difference))

    previous_rating_map = models.RatingMap.objects.filter(
        release_id = previous_releases[0][0].id,
    ).prefetch_related(
        'ratings',
    ).order_by('created_at').last() if previous_releases else None

    rating_map = models.RatingMap.objects.create(release = release, ratings_for = release)

    new_ratings = []

    example_map = {
        cardboardize(cubeable): cubeable
        for cubeable in
        release.cube.cubeables.distinct_elements()
    }

    if not previous_rating_map:
        for cardboard_cubeable in cardboard_cube.cubeables.distinct_elements():
            new_ratings.append(
                models.CardboardCubeableRating(
                    rating_map = rating_map,
                    cardboard_cubeable = cardboard_cubeable,
                    cardboard_cubeable_id = cardboard_cubeable.id,
                    example_cubeable = example_map[cardboard_cubeable],
                    rating = AVERAGE_RATING,
                )
            )

    else:
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
            for trap in pool_deck.pool.pool.as_cardboards.garbage_traps:
                for cardboard in trap.node.flattened:
                    pool_occurrences[cardboard] += difference

        conversion_rate_map = {
            cardboard: deck_conversions[cardboard] / p_occurrences
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
                node_conversion_rates = (
                    (
                        node,
                        conversion_rate_map.get(node, 0.)
                        if isinstance(node, Cardboard) else
                        max(conversion_rate_map.get(child, 0.) for child in node.flattened)
                    )
                    for node in
                    cardboard_cubeable.node.children
                )

                for node, weighted_rating in zip(
                    (n for n, _ in node_conversion_rates),
                    distribute_value_weighted(rating, [v for _, v in node_conversion_rates]),
                ):
                    previous_ratings_node_map[node].append(weighted_rating)

        previous_ratings_node_map: t.Mapping[CardboardNodeChild, int] = {
            k: int(average(v))
            for k, v in
            previous_ratings_node_map.items()
        }

        for cardboard_cubeable in cardboard_cube.cubeables.distinct_elements():
            new_ratings.append(
                models.CardboardCubeableRating(
                    rating_map = rating_map,
                    cardboard_cubeable = cardboard_cubeable,
                    cardboard_cubeable_id = cardboard_cubeable.id,
                    example_cubeable = example_map[cardboard_cubeable],
                    rating = (
                        int(
                            sum(
                                previous_ratings_node_map.get(
                                    node,
                                    AVERAGE_RATING / len(cardboard_cubeable.node.children),
                                )
                                for node in
                                cardboard_cubeable.node.children
                            )
                        )
                        if (
                            isinstance(cardboard_cubeable, CardboardTrap)
                            and cardboard_cubeable.intention_type == IntentionType.GARBAGE
                        ) else
                        previous_rating_map.get(cardboard_cubeable, AVERAGE_RATING)
                    ),
                )
            )

        rescale_eloeds(
            eloeds = new_ratings,
            average_rating = AVERAGE_RATING,
            reset_factor = previous_releases[0][1],
        )

    models.CardboardCubeableRating.objects.bulk_create(new_ratings)


@shared_task()
@transaction.atomic()
def generate_ratings_map_for_draft(draft_session_id: int) -> None:
    draft_session = DraftSession.objects.get(id = draft_session_id)

    booster_specification = draft_session.pool_specification.specifications.get()

    if not isinstance(booster_specification, CubeBoosterSpecification):
        raise ValueError('Can only generate rating maps for cube booster drafts')

    previous_rating_map = models.RatingMap.objects.filter(
        release_id = booster_specification.release_id,
    ).prefetch_related(
        'ratings',
    ).order_by('created_at').last()

    rating_map = models.RatingMap.objects.create(
        release = booster_specification.release,
        ratings_for = draft_session,
    )

    new_ratings = {
        rating.cardboard_cubeable: models.CardboardCubeableRating(
            rating_map = rating_map,
            cardboard_cubeable = rating.cardboard_cubeable,
            cardboard_cubeable_id = rating.cardboard_cubeable.id,
            example_cubeable = rating.example_cubeable,
            rating = rating.rating,
        ) for rating in
        previous_rating_map.ratings.all()
    }

    for draft_pick in DraftPick.objects.filter(seat__session_id = draft_session.id).order_by('created_at'):
        for picked, not_picked in itertools.product(
            (cardboardize(picked) for picked in draft_pick.pick.picked if picked is not None),
            draft_pick.pack.cubeables.as_cardboards,
        ):
            adjust_eloeds(
                new_ratings[picked],
                new_ratings[not_picked],
                k = int(32 / len(draft_pick.pack.cubeables)),
            )

    models.CardboardCubeableRating.objects.bulk_create(new_ratings.values())
