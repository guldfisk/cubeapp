import datetime
import subprocess

import pandas as pd
import psycopg2
from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.db.models import Max

from api.boto import get_boto_client, get_last_key
from api.mail import mail_me
from kpd import models
from kpd.service import get_transactions


@shared_task()
def check_transactions():
    if not models.SessionKey.objects.exists():
        mail_me(
            "No session key",
            "{}/update-token".format(settings.HOST),
        )
        return

    session_key = models.SessionKey.objects.order_by("created_at").last()

    if not session_key.expiration_notified and session_key.valid_until - datetime.timedelta(
        days=3
    ) < datetime.datetime.now(datetime.timezone.utc):
        mail_me(
            "Bank session expires soon",
            "expires on {}\n{}/update-token".format(
                session_key.valid_until.strftime("%d/%m/%Y %H:%M:%S"),
                settings.HOST,
            ),
        )
        session_key.expiration_notified = True
        session_key.save(update_fields=("expiration_notified",))

    with transaction.atomic():
        last_date = models.RangeRequest.objects.all().aggregate(Max("requested_to"))[
            "requested_to__max"
        ] or datetime.date(year=2000, month=1, day=1)

        target_date = datetime.datetime.now().date()
        if last_date >= target_date:
            return

        models.RangeRequest.objects.create(requested_from=last_date, requested_to=target_date)

        for bank_transaction in get_transactions(session_key.key, last_date - datetime.timedelta(days=1), target_date):
            if any("PASHA KEBAB" in s for s in bank_transaction.get("remittance_information", ())):
                models.KebabEvent.objects.get_or_create(
                    timestamp=datetime.datetime.strptime(
                        bank_transaction["entry_reference"],
                        "%Y-%m-%d-%H.%S.%M.%f",
                    ).replace(tzinfo=datetime.timezone.utc)
                )

        models.LogPoint.objects.filter(type="kebab").delete()

        finished_dates = [event.timestamp.date() for event in models.KebabEvent.objects.order_by("timestamp")]

        if not finished_dates:
            return

        finished_dates_map = [0 for _ in range((target_date - finished_dates[0]).days + 1)]

        for finished_date in finished_dates:
            finished_dates_map[(finished_date - finished_dates[0]).days] += 1

        from_date = finished_dates[0]
        date_span = (target_date - from_date).days

        series = pd.Series([0] + finished_dates_map)

        half_lives = (1, 4, 16)
        smooth_points = [list(series.ewm(halflife=half_life).mean())[1:] for half_life in half_lives]

        points = []

        for idx in range(date_span):
            points.append(
                models.LogPoint(
                    type="kebab",
                    timestamp=datetime.datetime.combine(
                        from_date + datetime.timedelta(days=idx),
                        datetime.datetime.min.time(),
                        tzinfo=datetime.timezone.utc,
                    ),
                    value_short=smooth_points[0][idx],
                    value_medium=smooth_points[1][idx],
                    value_long=smooth_points[2][idx],
                )
            )

        models.LogPoint.objects.bulk_create(points)


@shared_task()
def update_waffles():
    client = get_boto_client()
    last_key = get_last_key(client, "fml/db-backups")

    if last_key is None:
        return

    with subprocess.Popen(
        [
            "pg_restore",
            "--dbname=postgresql://{}:{}@{}:{}/{}".format(
                settings.DATABASE_USER,
                settings.DATABASE_PASSWORD,
                settings.DATABASE_HOST,
                settings.DATABASE_PORT,
                settings.DATABASE_NAME,
            ),
            "--clean",
            "--create",
            "-Fc",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.PIPE,
    ) as s, s.stdin as f:
        client.download_fileobj("phdk", last_key, f)

    with psycopg2.connect(
        host=settings.DATABASE_HOST,
        user=settings.DATABASE_USER,
        password=settings.DATABASE_PASSWORD,
        dbname="fml",
    ) as fml_connection:
        fml_connection = fml_connection.cursor()

        fml_connection.execute(
            """select started_at from alarm where (text='vafel' or text='vaffel') """
            """and canceled=false order by started_at;"""
        )

        waffle_times = [row[0] for row in fml_connection.fetchall()]

    now = datetime.datetime.now()

    finished_dates_map = [0 for _ in range((now - waffle_times[0]).days + 1)]

    from_date = datetime.datetime(
        year=waffle_times[0].year,
        month=waffle_times[0].month,
        day=waffle_times[0].day,
    )
    date_span = (now - from_date).days

    for waffle_time in waffle_times:
        finished_dates_map[(waffle_time - from_date).days] += 2

    series = pd.Series([0] + finished_dates_map)

    half_lives = (1, 4, 16)
    smooth_points = [list(series.ewm(halflife=half_life).mean())[1:] for half_life in half_lives]

    points = []

    for idx in range(date_span):
        points.append(
            models.LogPoint(
                type="waffle",
                timestamp=datetime.datetime.combine(
                    from_date + datetime.timedelta(days=idx),
                    datetime.datetime.min.time(),
                    tzinfo=datetime.timezone.utc,
                ),
                value_short=smooth_points[0][idx],
                value_medium=smooth_points[1][idx],
                value_long=smooth_points[2][idx],
            )
        )

    with transaction.atomic():
        models.LogPoint.objects.filter(type="waffle").delete()
        models.LogPoint.objects.bulk_create(points)
