from __future__ import absolute_import

import os

from celery import Celery
from celery.schedules import crontab


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cubeapp.settings')

redis_url = 'redis://redis:6379/0'

app = Celery(
    'cubeapp',
    broker=redis_url,
    backend=redis_url,
)
app.config_from_object('django.conf:settings', namespace='CELERY')

app.conf.beat_schedule = {
    'clean_drafts': {
        'task': 'draft.tasks.clean_drafts',
        'schedule': crontab(hour = 4, minute = 0),
    },
}


app.autodiscover_tasks()
