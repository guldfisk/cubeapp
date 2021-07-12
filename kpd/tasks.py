import datetime
import pytz

import pandas as pd

from django.db import transaction
from django.db.models import Max

from celery import shared_task

from kpd import models
from kpd.service import get_transactions


@shared_task()
@transaction.atomic()
def check_transactions():
    last_date = (
        models.RangeRequest.objects.all().aggregate(Max('requested_to'))['requested_to__max']
        or datetime.date(year = 1900, month = 1, day = 1)
    )

    target_date = datetime.datetime.now().date() - datetime.timedelta(days = 1)
    if last_date >= target_date:
        return

    events = []

    for bank_transaction in get_transactions(last_date, target_date):
        if any('PASHA KEBAB' in s for s in bank_transaction.get('remittance_information', ())):
            events.append(
                models.KebabEvent(
                    timestamp = datetime.datetime.strptime(
                        bank_transaction['entry_reference'],
                        '%Y-%m-%d-%H.%S.%M.%f',
                    ).replace(tzinfo = pytz.utc)
                )
            )

    models.KebabEvent.objects.bulk_create(events)

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
                timestamp = from_date + datetime.timedelta(days = idx),
                value_short = smooth_points[0][idx],
                value_medium = smooth_points[1][idx],
                value_long = smooth_points[2][idx],
            )
        )

    models.KebabPoint.objects.bulk_create(points)

    models.RangeRequest.objects.create(requested_from = last_date, requested_to = target_date)
