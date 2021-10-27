import datetime
import itertools

from celery import shared_task
from django.db.models import Q, Count

from api.models import RelatedPrinting
from draft import models
from draft.models import DraftPick
from magiccube.collections.cube import Cube


@shared_task()
def clean_drafts() -> None:
    now = datetime.datetime.now()
    for draft in models.DraftSession.objects.annotate(
        seat_count = Count('seats'),
    ).filter(
        Q(
            started_at__lte = now - datetime.timedelta(days = 1),
            seat_count__lte = 1,
        ) | Q(
            started_at__lte = now - datetime.timedelta(days = 7),
            limited_session__isnull = True,
        )
    ).order_by('started_at').prefetch_related(
        'limited_session',
        'limited_session__tournament',
    ):
        if draft.limited_session:
            if draft.limited_session.tournament:
                draft.limited_session.tournament.delete()
            draft.limited_session.delete()

        draft.delete()


@shared_task()
def create_draft_session_related_printings(draft_session_id: int) -> None:
    RelatedPrinting.objects.bulk_create(
        RelatedPrinting(
            related = pick,
            printing_id = printing.id,
        )
        for pick in
        DraftPick.objects.filter(seat__session_id = draft_session_id)
        for printing in
        set(Cube(pick.cubeables).all_printings)
    )
