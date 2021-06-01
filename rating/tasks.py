import itertools
import logging

from celery import shared_task

from django.db import transaction

from magiccube.collections.cubeable import cardboardize
from magiccube.laps.traps.trap import CardboardTrap, IntentionType

from elo.utils import rescale_eloeds, adjust_eloeds

from api.models import CubeRelease
from draft.models import DraftSession, DraftPick
from limited.models import CubeBoosterSpecification
from rating import models
from rating.calc import get_previous_ratings_map_by_conversion_rate, get_previous_releases_for_release, get_node_rating_components
from rating.values import AVERAGE_RATING


@shared_task()
@transaction.atomic()
def generate_ratings_map_for_release(release_id: int) -> None:
    release = CubeRelease.objects.get(pk = release_id)
    if release.rating_maps.exists():
        logging.info('Rating map already generated for release {}'.format(release_id))
        return

    cardboard_cube = release.cube.as_cardboards

    previous_releases = get_previous_releases_for_release(release)

    previous_rating_map = models.RatingMap.objects.filter(
        release_id = previous_releases[0][0].id,
    ).prefetch_related(
        'ratings',
    ).order_by('created_at').last() if previous_releases else None

    rating_map = models.RatingMap.objects.create(
        release = release,
        ratings_for = release,
        parent = previous_rating_map,
    )
    models.RatingMap.objects.filter(id = rating_map.id).update(created_at = release.created_at)

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
        previous_rating_map, previous_ratings_node_map = get_previous_ratings_map_by_conversion_rate(
            previous_releases,
            previous_rating_map,
        )

        for cardboard_cubeable in cardboard_cube.cubeables.distinct_elements():
            rating_seed = previous_rating_map.get(cardboard_cubeable)
            if rating_seed is None:
                if isinstance(cardboard_cubeable, CardboardTrap) and cardboard_cubeable.intention_type == IntentionType.GARBAGE:
                    rating_seed = int(
                        sum(
                            rating / 2 ** idx
                            for idx, rating in
                            enumerate(
                                sorted(
                                    (
                                        previous_ratings_node_map.get(
                                            node,
                                            AVERAGE_RATING / len(cardboard_cubeable.node.children),
                                        )
                                        for node in
                                        cardboard_cubeable.node.children
                                    ),
                                    reverse = True,
                                )
                            )
                        )
                    )
                else:
                    rating_seed = AVERAGE_RATING
            new_ratings.append(
                models.CardboardCubeableRating(
                    rating_map = rating_map,
                    cardboard_cubeable = cardboard_cubeable,
                    cardboard_cubeable_id = cardboard_cubeable.id,
                    example_cubeable = example_map[cardboard_cubeable],
                    rating = rating_seed,
                )
            )

        rescale_eloeds(
            eloeds = new_ratings,
            average_rating = AVERAGE_RATING,
            reset_factor = previous_releases[0][1],
        )

        models.NodeRatingComponent.objects.bulk_create(
            get_node_rating_components(
                release,
                previous_ratings_node_map,
                rating_map,
            )
        )

    models.CardboardCubeableRating.objects.bulk_create(new_ratings)


@shared_task()
@transaction.atomic()
def generate_ratings_map_for_draft(draft_session_id: int) -> None:
    draft_session = DraftSession.objects.get(id = draft_session_id)
    if draft_session.rating_maps.exists():
        logging.info('Rating map already generated for draft_session {}'.format(draft_session_id))
        return

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
        parent_id = previous_rating_map.id,
    )
    models.RatingMap.objects.filter(id = rating_map.id).update(created_at = draft_session.ended_at)

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

    _, previous_ratings_node_map = get_previous_ratings_map_by_conversion_rate(
        get_previous_releases_for_release(booster_specification.release),
        previous_rating_map,
    )

    models.NodeRatingComponent.objects.bulk_create(
        get_node_rating_components(
            booster_specification.release,
            previous_ratings_node_map,
            rating_map,
        )
    )


@shared_task()
def check_new_rating_events():
    for rating_event in sorted(
        itertools.chain(
            CubeRelease.objects.filter(
                rating_maps__isnull = True,
                versioned_cube__active = True,
            ).only('created_at'),
            DraftSession.objects.competitive_drafts().filter(
                rating_maps__isnull = True,
            ).only('started_at'),
        ),
        key = lambda e: e.created_at if isinstance(e, CubeRelease) else e.started_at,
    ):
        if isinstance(rating_event, CubeRelease):
            generate_ratings_map_for_release.delay(rating_event.id)
        else:
            generate_ratings_map_for_draft.delay(rating_event.id)
