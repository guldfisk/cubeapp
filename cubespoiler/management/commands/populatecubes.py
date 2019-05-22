
from django.core.management.base import BaseCommand, CommandError

from mtgorp.models.serilization.strategies.jsonid import JsonId

from misccube.cubeload.load import CubeLoader

from resources.staticdb import db
from cubespoiler.models import CubeContainer


class Command(BaseCommand):
	
	help = 'Populate cubes'

	def handle(self, *args, **options):

		# pass

		cube_loader = CubeLoader(db)

		CubeContainer.objects.all().delete()

		for cube, time in cube_loader.all_cubes():
			print(time)
			cube_container = CubeContainer(
				cube_content=JsonId.serialize(cube),
				checksum=cube.persistent_hash(),
				created_at=time,
			)
			cube_container.save()

		print('--------')

		for container in CubeContainer.objects.all().order_by('-created_at'):
			print(container.created_at)