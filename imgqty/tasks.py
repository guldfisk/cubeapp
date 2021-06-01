import typing as t

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.db import transaction

from celery import shared_task
from django.template.loader import get_template

from api.mail import send_mail
from draft.models import DraftSession, DraftPick
from imgqty import models
from imgqty.service import ImageQtyProbabilityManager, get_cubeable_image_amount
from limited.models import LimitedSession


@shared_task()
def check_new_image_records() -> None:
    for draft_session in DraftSession.objects.competitive_drafts().filter(
        limited_session__state = LimitedSession.LimitedSessionState.FINISHED,
        image_quantity_checks__isnull = True,
    ).order_by('started_at').prefetch_related(
        'pool_specification__specifications__release'
    ):
        release = draft_session.pool_specification.specifications.get().release

        previous_image_record = models.ImageQtyRecordPack.objects.filter(
            release__versioned_cube_id = release.versioned_cube_id,
        ).order_by('pick__created_at').last()
        previous_image_record_amount = 0 if previous_image_record is None else previous_image_record.image_amount

        largest_image_amount = previous_image_record_amount
        largest_image_pick = None

        for draft_pick in DraftPick.objects.filter(seat__session = draft_session, pick_number = 1):
            image_amount = sum(map(get_cubeable_image_amount, draft_pick.cubeables))
            if image_amount > largest_image_amount:
                largest_image_amount = image_amount
                largest_image_pick = draft_pick

        with transaction.atomic():
            if largest_image_pick:
                pack_size = len(list(largest_image_pick.cubeables))
                record = models.ImageQtyRecordPack.objects.create(
                    pick = largest_image_pick,
                    release = release,
                    image_amount = largest_image_amount,
                    average_image_amount = largest_image_amount / pack_size,
                    probability = ImageQtyProbabilityManager(release.cube, pack_size).probability_at_least_images(largest_image_amount),
                )

            models.DraftChecked.objects.create(draft = draft_session)

        if not settings.DEBUG:
            send_record_notification_mail(record, get_user_model().objects.all())


def send_record_notification_mail(record: models.ImageQtyRecordPack, users: t.Sequence[AbstractUser]) -> None:
    send_mail(
        subject = 'New image record!',
        content = get_template('new_record_mail.html').render(
            {
                'record': record,
            }
        ),
        recipients = [user.email for user in users],
    )
