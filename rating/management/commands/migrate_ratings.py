import typing as t
import itertools

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count

from mtgorp.models.formats.format import LimitedSideboard

from api.models import VersionedCube, CubeRelease
from draft.models import DraftSession
from limited.models import CubeBoosterSpecification
from rating.tasks import generate_ratings_map_for_release, generate_ratings_map_for_draft


class Command(BaseCommand):
    help = 'Migrate ratings'

    @classmethod
    def _rating_event_timestamp(cls, rating_event: t.Union[CubeRelease, DraftSession]):
        return rating_event.created_at if isinstance(rating_event, CubeRelease) else rating_event.started_at

    @transaction.atomic()
    def handle(self, *args, **options):
        for versioned_cube in VersionedCube.objects.all():
            for rating_event in sorted(
                itertools.chain(
                    versioned_cube.releases.all(),
                    DraftSession.objects.annotate(
                        specifications_count = Count(
                            'pool_specification__specifications'
                        ),
                    ).filter(
                        specifications_count = 1,
                        limited_session__format = LimitedSideboard.name,
                        pool_specification__specifications__type = CubeBoosterSpecification._typedmodels_type,
                        pool_specification__specifications__release__versioned_cube_id = versioned_cube.id,
                        pool_specification__specifications__allow_intersection = False,
                        pool_specification__specifications__allow_repeat = False,
                    ),
                ),
                key = self._rating_event_timestamp,
            ):
                print(versioned_cube.name, versioned_cube.id, rating_event, self._rating_event_timestamp(rating_event))
                try:
                    if isinstance(rating_event, CubeRelease):
                        generate_ratings_map_for_release(rating_event.id)
                    else:
                        generate_ratings_map_for_draft(rating_event.id)
                except ValueError as e:
                    print(e, ' (skipped)')
