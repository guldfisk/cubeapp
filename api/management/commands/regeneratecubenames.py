import hashlib

from django.core.management.base import BaseCommand

from mocknames.generate import NameGenerator

from api import models


class Command(BaseCommand):
    help = 'Regenerate cube names'

    def handle(self, *args, **options):
        for release in models.CubeRelease.objects.all():
            release.name = NameGenerator().get_name(
                int(
                    hashlib.sha1(
                        release.cube.persistent_hash().encode('ASCII')
                    ).hexdigest(),
                    16,
                )
            )
            release.checksum = release.cube.persistent_hash()
            release.save()
