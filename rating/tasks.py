import typing as t
import datetime

from celery import shared_task
from django.db import transaction

from elo import utils

from api.models import CubeRelease

from rating import models

from rating import values


# @shared_task()
# @transaction.atomic()
# def generate_ratings_map_for_release(release_id: str) -> None:
#     release = CubeRelease.objects.prefetch_related('rating_map').get(pk = release_id)
#
#     if release.rating_maps.exists() is not None:
#         raise ValueError('rating map already generated')
#
#     cardboard_cube = release.cube.as_cardboards
#
#     # previous_release = release.previous_release
#     # previous_rating_map = models.RatingMap.objects.filter(
#     #     release__versioned_cube = release.versioned_cube,
#     # ).prefetch_related(
#     #     'ratings',
#     # ).order_by('created_at').last()
#     previous_ratings_map: t.Mapping[str, models.CardboardCubeableRating] = {
#         rating.cardboard_cubeable_id: rating
#         for rating in
#         models.CardboardCubeableRating.objects.filter(
#             cardboard_cubeable_id__in = (
#                 cubeable.persistent_has()
#                 for cubeable in
#                 cardboard_cube.cardboard_cubeables.distinct_elements()
#             ),
#         ).order_by('created_at')
#     }
#
#     rating_map = models.RatingMap.objects.create(release = release)
#
#     if previous_rating_map:
#
#         previous_rating_map = {
#             rating.cardboard_cubeable: rating
#             for rating in
#             previous_rating_map.ratings
#         }
#
#         ratings = []
#
#         for cardboard_cubeable, multiplicity in release.cube.as_cardboards.cardboard_cubeables.items():
#             cardboard_cubeable_id = cardboard_cubeable.id
#             previous_rating = previous_ratings_map.get(cardboard_cubeable_id)
#             ratings.append(
#                 models.CardboardCubeableRating(
#                     rating_map = rating_map,
#                     cardboard_cubeable = cardboard_cubeable,
#                     cardboard_cubeable_id = cardboard_cubeable_id,
#                     rating = previous_rating.rating if previous_rating else values.AVERAGE_RATING,
#                 )
#             )
#
#         for rating, new_elo in utils.rescale(previous_rating_map.ratings, reset_factor = .5):
#             ratings.append(
#                 models.CardboardCubeableRating(
#                     rating_map = rating_map,
#                     cardboard_cubeable = rating.cardboard_cubeable,
#                     cardboard_cubeable_id = rating.cardboard_cubeable_id,
#                     rating = rating.rating,
#                 )
#             )
