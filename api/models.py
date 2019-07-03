from django.db import models
from django.utils.timezone import now
from django.contrib.auth import get_user_model

from mtgorp.models.serilization.strategies.jsonid import JsonId

from magiccube.collections.cube import Cube

from resources.staticdb import db


class CubeContainer(models.Model):
	created_at = models.DateTimeField(default=now)
	checksum = models.CharField(max_length=256)
	name = models.CharField(max_length=64)
	# intended_size = models.PositiveIntegerField()
	cube_content = models.TextField()

	class Meta:
		ordering = ('-created_at',)

	@property
	def cube(self) -> Cube:
		return JsonId(db).deserialize(Cube, self.cube_content)


class VersionedCube(models.Model):
	created_at = models.DateTimeField(default=now)
	name = models.CharField(max_length=128)
	# author = models.ForeignKey(
	# 	get_user_model(),
	# 	on_delete=models.CASCADE,
	# )
