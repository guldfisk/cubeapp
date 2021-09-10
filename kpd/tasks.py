import datetime

import pandas as pd

from django.conf import settings
from django.db import transaction, IntegrityError
from django.db.models import Max

from celery import shared_task

from api.mail import mail_me
from kpd import models
from kpd.service import get_transactions


@shared_task()
def check_transactions():
    if not models.SessionKey.objects.exists():
        mail_me(
            'No session key',
            '{}/update-token'.format(settings.HOST),
        )
        return

    session_key = models.SessionKey.objects.order_by('created_at').last()

    if (
        not session_key.expiration_notified
        and session_key.valid_until + datetime.timedelta(days = 3) < datetime.datetime.now(datetime.timezone.utc)
    ):
        mail_me(
            'Bank session expires soon',
            'expires on {}\n{}/update-token'.format(
                session_key.valid_until.strftime('%d/%m/%Y %H:%M:%S'),
                settings.HOST,
            ),
        )
        session_key.expiration_notified = True
        session_key.save(update_fields = ('expiration_notified',))

    with transaction.atomic():
        last_date = (
            models.RangeRequest.objects.all().aggregate(Max('requested_to'))['requested_to__max']
            or datetime.date(year = 2000, month = 1, day = 1)
        )

        target_date = datetime.datetime.now().date()
        if last_date >= target_date:
            return

        models.RangeRequest.objects.create(requested_from = last_date, requested_to = target_date)

        for bank_transaction in get_transactions(session_key.key, last_date - datetime.timedelta(days = 1), target_date):
            if any('PASHA KEBAB' in s for s in bank_transaction.get('remittance_information', ())):
                models.KebabEvent.objects.get_or_create(
                    timestamp = datetime.datetime.strptime(
                        bank_transaction['entry_reference'],
                        '%Y-%m-%d-%H.%S.%M.%f',
                    ).replace(tzinfo = datetime.timezone.utc)
                )

        models.KebabPoint.objects.all().delete()

        finished_dates = [
            event.timestamp.date()
            for event in
            models.KebabEvent.objects.order_by('timestamp')
        ]

        if not finished_dates:
            return

        finished_dates_map = [
            0
            for _ in range(
                (target_date - finished_dates[0]).days + 1
            )
        ]

        for finished_date in finished_dates:
            finished_dates_map[(finished_date - finished_dates[0]).days] += 1

        from_date = finished_dates[0]
        date_span = (target_date - from_date).days

        series = pd.Series([0] + finished_dates_map)

        half_lives = (1, 4, 16)
        smooth_points = [
            list(series.ewm(halflife = half_life).mean())[1:]
            for half_life in
            half_lives
        ]

        points = []

        for idx in range(date_span):
            points.append(
                models.KebabPoint(
                    timestamp = datetime.datetime.combine(
                        from_date + datetime.timedelta(days = idx),
                        datetime.datetime.min.time(),
                        tzinfo = datetime.timezone.utc
                    ),
                    value_short = smooth_points[0][idx],
                    value_medium = smooth_points[1][idx],
                    value_long = smooth_points[2][idx],
                )
            )

        models.KebabPoint.objects.bulk_create(points)
