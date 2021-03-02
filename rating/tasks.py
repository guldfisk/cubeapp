import itertools
import typing as t
from collections import defaultdict

from numpy import average

from celery import shared_task

from django.db import transaction

from magiccube.collections.cubeable import cardboardize
from magiccube.laps.traps.trap import CardboardTrap, IntentionType
from magiccube.laps.traps.tree.printingtree import CardboardNodeChild

from elo.utils import rescale_eloeds, adjust_eloeds

from api.models import CubeRelease
from draft.models import DraftSession, DraftPick
from limited.models import CubeBoosterSpecification

from rating import models
from rating.values import AVERAGE_RATING


@shared_task()
@transaction.atomic()
def generate_ratings_map_for_release(release_id: int) -> None:
    release = CubeRelease.objects.get(pk = release_id)

    cardboard_cube = release.cube.as_cardboards

    previous_rating_map = models.RatingMap.objects.filter(
        release__versioned_cube = release.versioned_cube,
    ).prefetch_related(
        'ratings',
    ).order_by('created_at').last()

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
        previous_rating_map = {
            rating.cardboard_cubeable: rating.rating
            for rating in
            previous_rating_map.ratings.all()
        }
        previous_ratings_node_map: t.DefaultDict[CardboardNodeChild, t.List[float]] = defaultdict(list)

        for cardboard_cubeable, rating in previous_rating_map.items():
            if isinstance(cardboard_cubeable, CardboardTrap) and cardboard_cubeable.intention_type == IntentionType.GARBAGE:
                for node in cardboard_cubeable.node.children:
                    previous_ratings_node_map[node].append(rating / len(cardboard_cubeable.node.children))

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
        release__versioned_cube = booster_specification.release.versioned_cube,
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

    if previous_rating_map.release_id != booster_specification.release_id:
        raise ValueError('Draft release must match last rating map release')

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
