import dataclasses
import datetime

from celery import shared_task

from django.template.loader import get_template

from dmiclient.client import DMIClient

from api.mail import mail_me
from weather import models
from weather import settings
from weather.service import get_next_weekday


HARESKOVEN = 2623928


@shared_task()
def check_weather():
    now = datetime.datetime.now()
    next_sunday = get_next_weekday(6, now)
    target_from = next_sunday + datetime.timedelta(hours = 9)
    target_to = next_sunday + datetime.timedelta(hours = 14)

    if target_to > now + datetime.timedelta(days = 1, hours = 23):
        return

    forecast_slice = DMIClient().get_forecast(HARESKOVEN).values_in_range(target_from, target_to)

    last_record = models.ForecastSliceSnapShot.objects.filter(
        created_at__gte = now - datetime.timedelta(days = 2),
    ).order_by('created_at').last()

    body = get_template('weather_update_mail.html').render(
        {
            'precipitation': round(forecast_slice.total_precipitation, 2),
            'precipitation_types': ' '.join(sorted(forecast_slice.precipitation_types)),
            'average_temperature': round(forecast_slice.average_temperature, 2),
        }
    )

    if last_record is None:
        if forecast_slice.total_precipitation > settings.PRECIPITATION_MM_THRESHOLD:
            mail_me(
                f'It\'s looking rainy!',
                body,
            )
        else:
            mail_me(
                f'Weather looks good',
                body,
            )
    else:
        precipitation_delta = forecast_slice.total_precipitation - last_record.total_precipitation
        if precipitation_delta > settings.PRECIPITATION_MM_DELTA_THRESHOLD:
            mail_me(
                f'Weather looking worse :(',
                body,
            )
        elif precipitation_delta < -settings.PRECIPITATION_MM_DELTA_THRESHOLD:
            mail_me(
                f'Weather looking better :)',
                body,
            )

    vs = dataclasses.asdict(forecast_slice)
    vs['precipitation_types'] = sorted(forecast_slice.precipitation_types)
    models.ForecastSliceSnapShot.objects.create(**vs)
