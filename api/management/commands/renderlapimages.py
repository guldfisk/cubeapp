import itertools
import time

import promise

from django.core.management.base import BaseCommand

from mtgimg import interface

from resources.staticimageloader import image_loader

from api.models import CubeRelease


class Command(BaseCommand):
    help = 'Render lap images for existing releases'

    def add_arguments(self, parser):
        parser.add_argument('last_n_cubes', type=int, default=None, nargs='?')

    def handle(self, *args, **options):
        laps = set(
            itertools.chain(
                *(
                    cube_container.cube.laps
                    for cube_container in
                    CubeRelease.objects.all().order_by('-created_at')[:options['last_n_cubes']]
                )
            )
        )

        st = time.time()

        images = promise.Promise.all(
            [
                image_loader.get_image(trap, size_slug = size_slug, save = True, cache_only = True)
                for trap in
                laps
                for size_slug in
                interface.SizeSlug
            ]
        ).get()

        print(f'Done, rendered {len(images)} images.')
        print(time.time() - st)
