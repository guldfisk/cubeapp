import hashlib

from django.core.management.base import BaseCommand, CommandError

from mocknames.generate import NameGenerator

from mtgorp.models.serilization.strategies.jsonid import JsonId

from misccube.cubeload.load import CubeLoader

from resources.staticdb import db
from api.models import CubeContainer


class Command(BaseCommand):
	
	help = 'Populate cubes'

	def handle(self, *args, **options):

		name_generator = NameGenerator()

		cube_loader = CubeLoader(db)

		CubeContainer.objects.all().delete()

		for cube, time in cube_loader.all_cubes():
			print(cube.persistent_hash())
			cube_container = CubeContainer(
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
			)
			cube_container.save()

		for cube in CubeContainer.objects.all():
			print(cube.name, cube.checksum)


