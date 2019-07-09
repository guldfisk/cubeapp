import hashlib

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

from mocknames.generate import NameGenerator

from mtgorp.models.serilization.strategies.jsonid import JsonId

from misccube.cubeload.load import CubeLoader
from misccube.trapification.algorithm import ConstrainedNodes
from misccube.trapification.fetch import ConstrainedNodeFetcher

from resources.staticdb import db
from api import models


class Command(BaseCommand):
    help = 'Populate cubes'

    def handle(self, *args, **options):
        get_user_model().objects.all().delete()
        models.VersionedCube.objects.all().delete()
        models.CubeRelease.objects.all().delete()

        root_user = get_user_model().objects.create_user(
            username='root',
            password='1234',
            email='ceguldfisk@gmail.com',
            is_staff=True,
            is_superuser=True,
        )
        versioned_cube = models.VersionedCube.objects.create(
            name='xd',
            description='haha',
            author=root_user,
        )

        name_generator = NameGenerator()

        cube_loader = CubeLoader(db)

        for cube, time in cube_loader.all_cubes():
            models.CubeRelease.objects.create(
                cube_content=JsonId.serialize(cube),
                checksum=cube.persistent_hash(),
                name=name_generator.get_name(
                    int(
                        hashlib.sha1(
                            cube.persistent_hash().encode('ASCII')
                        ).hexdigest(),
                        16,
                    )
                ),
                created_at=time,
                versioned_cube=versioned_cube,
                intended_size=360,
            )

        for cube in models.CubeRelease.objects.all():
            print(cube.name, cube.checksum)

        models.ConstrainedNodes.objects.create(
            release=models.CubeRelease.objects.order_by('-created_at').first(),
            constrained_nodes_content=JsonId.serialize(
                ConstrainedNodes(
                    ConstrainedNodeFetcher(db).fetch_garbage()
                )

            )
        )
