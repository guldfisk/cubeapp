from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from api import models
from draft.coordinator import DRAFT_COORDINATOR


class Command(BaseCommand):
    help = 'start new draft'

    def handle(self, *args, **options):
        user = get_user_model().objects.get(username='root')
        cube = models.CubeRelease.objects.get(pk=14).cube
        drafters = DRAFT_COORDINATOR.start_draft(
            (user,),
            cube,
        )
        for user, drafter in drafters:
            print(user.username, drafter.key)

