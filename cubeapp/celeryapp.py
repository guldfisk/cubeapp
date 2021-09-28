from __future__ import absolute_import

import os
from datetime import timedelta

from django.conf import settings

from celery import Celery
from celery.schedules import crontab


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cubeapp.settings')

redis_url = 'redis://redis:6379/0'

app = Celery(
    'cubeapp',
    broker = redis_url,
    backend = redis_url,
)
app.config_from_object('django.conf:settings', namespace = 'CELERY')

app.conf.beat_schedule = {
    'clean_drafts': {
        'task': 'draft.tasks.clean_drafts',
        'schedule': crontab(hour = 4, minute = 0),
    },
    'create_seasons': {
        'task': 'league.tasks.create_seasons',
        'schedule': timedelta(minutes = 5),
    },
    'check_new_rating_events': {
        'task': 'rating.tasks.check_new_rating_events',
        'schedule': timedelta(minutes = 10),
    },
    'check_new_image_records': {
        'task': 'imgqty.tasks.check_new_image_records',
        'schedule': timedelta(hours = 1),
    }
}

if not settings.DEBUG:
    app.conf.beat_schedule['check_json'] = {
        'task': 'api.tasks.check_mtg_json',
        'schedule': timedelta(hours = 1),
    }
    app.conf.beat_schedule['backup_db'] = {
        'task': 'api.tasks.backup_db',
        'schedule': crontab(hour = 4, minute = 30),
    }
    app.conf.beat_schedule['kebab_check'] = {
        'task': 'kpd.tasks.check_transactions',
        'schedule': timedelta(hours = 1),
    }
    app.conf.beat_schedule['update_waffles'] = {
        'task': 'kpd.tasks.update_waffles',
        'schedule': crontab(hour = 3, minute = 0),
    }
    app.conf.beat_schedule['weather_check'] = {
        'task': 'weather.tasks.check_weather',
        'schedule': timedelta(hours = 1),
    }

app.autodiscover_tasks()
