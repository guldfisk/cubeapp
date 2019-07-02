import itertools
import time

import promise

from multiset import Multiset

from django.core.management.base import BaseCommand, CommandError

from mtgimg import interface

from resources.staticimageloader import image_loader
from resources.staticdb import db

from api.models import CubeContainer


class Command(BaseCommand):
    help = 'Populate cubes'

    def handle(self, *args, **options):

        laps = set(
            itertools.chain(
                *(
                    cube_container.cube.laps
                    for cube_container in
                    CubeContainer.objects.all()
                )
            )
        )

        st = time.time()

        images = promise.Promise.all(
            [
                image_loader.get_image(trap, size_slug=size_slug, save=True)
                for trap in
                laps
                for size_slug in
                interface.SizeSlug
            ]
        ).get()

        print(f'Done, rendered {len(images)} images.')
        print(time.time() - st)
