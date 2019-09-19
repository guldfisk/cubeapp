import os
import hashlib

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

from magiccube.collections.nodecollection import GroupMap
from mocknames.generate import NameGenerator

from mtgorp.models.serilization.strategies.jsonid import JsonId

from misccube.cubeload.load import CubeLoader
from misccube.trapification.algorithm import ConstrainedNodes
from misccube.trapification.fetch import ConstrainedNodeFetcher

from resources.staticdb import db
from api import models


_GROUP_WEIGHTS = {
    'WHITE': 1,
    'BLUE': 1.5,
    'BLACK': 1,
    'RED': 1,
    'GREEN': 1,
    'drawgo': 3,
    'mud': 3,
    'post': 4,
    'midrange': 2,
    'mill': 4,
    'reanimate': 4,
    'burn': 4,
    'hatebear': 2,
    'removal': 1,
    'lock': 3,
    'yardvalue': 3,
    'ld': 3,
    'storm': 4,
    'tezz': 3,
    'lands': 3,
    'shatter': 3,
    'bounce': 3,
    'shadow': 4,
    'stifle': 4,
    'beat': 1,
    'cheat': 4,
    'pox': 3,
    'counter': 3,
    'discard': 2,
    'cantrip': 4,
    'balance': 3,
    'stasis': 4,
    'standstill': 3,
    'whitehate': 4,
    'bluehate': 4,
    'blackhate': 4,
    'redhate': 4,
    'greenhate': 4,
    'antiwaste': 4,
    'delirium': 3,
    'sacvalue': 2,
    'lowtoughnesshate': 4,
    'armageddon': 4,
    'stax': 3,
    'bloom': 3,
    'weldingjar': 3,
    'drawhate': 4,
    'pluscard': 3,
    'ramp': 3,
    'devoteddruid': 4,
    'fetchhate': 4,
    'dragon': 2,
    'company': 2,
    'naturalorder': 3,
    'flash': 3,
    'wincon': 3,
    'vial': 4,
    # lands
    'fixing': 3,
    'colorlessvalue': 1,
    'fetchable': 2,
    'indestructable': 4,
    'legendarymatters': 1,
    'sol': 3,
    'manland': 4,
    'storage': 3,
    'croprotate': 3,
    'dnt': 3,
    'equipment': 4,
    'livingdeath': 3,
    'eggskci': 3,
    'hightide': 3,
    'fatty': 3,
    'walker': 4,
    'blink': 2,
    'miracles': 3,
    'city': 4,
    'wrath': 2,
    'landtax': 4,
    'discardvalue': 2,
    'edict': 2,
    'phoenix': 4,
    'enchantress': 2,
    'dork': 2,
    'tinker': 3,
    'highpowerhate': 2,
    'affinity': 3,
    'academy': 4,
    'stompy': 2,
    'shardless': 3,
    'lanterns': 3,
    'depths': 3,
    'survival': 2,
    'landstill': 2,
    'moat': 4,
    'combo': 3,
    'kite': 3,
    'haste': 3,
    'fog': 3,
    'threat': 4,
}


class Command(BaseCommand):
    help = 'Populate cubes'

    def handle(self, *args, **options):
        get_user_model().objects.all().delete()
        models.VersionedCube.objects.all().delete()
        models.CubeRelease.objects.all().delete()

        root_user = get_user_model().objects.create_user(
            username = 'root',
            password = os.environ['ROOT_USER_PASSWORD'],
            email = 'ceguldfisk@gmail.com',
            is_staff = True,
            is_superuser = True,
        )
        versioned_cube = models.VersionedCube.objects.create(
            name = 'xd',
            description = 'haha',
            author = root_user,
        )

        name_generator = NameGenerator()

        cube_loader = CubeLoader(db)

        first = True

        for cube, time in cube_loader.all_cubes():
            release = models.CubeRelease.objects.create(
                cube_content = JsonId.serialize(cube),
                checksum = cube.persistent_hash(),
                name = name_generator.get_name(
                    int(
                        hashlib.sha1(
                            cube.persistent_hash().encode('ASCII')
                        ).hexdigest(),
                        16,
                    )
                ),
                created_at = time,
                versioned_cube = versioned_cube,
                intended_size = 360,
            )

            if first:
                constrained_nodes = ConstrainedNodes(
                    ConstrainedNodeFetcher(db).fetch_garbage()
                )
                group_map = GroupMap(_GROUP_WEIGHTS)
            else:
                constrained_nodes = ConstrainedNodes(())
                group_map = GroupMap({})

            first = False

            models.ConstrainedNodes.objects.create(
                release=release,
                constrained_nodes_content=JsonId.serialize(
                    constrained_nodes
                ),
                group_map_content=JsonId.serialize(
                    group_map
                ),
            )

        for cube in models.CubeRelease.objects.all():
            print(cube.name, cube.checksum)


