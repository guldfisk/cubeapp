from django.db import models

from django.utils.timezone import now


class CubeContainer(models.Model):
	created_at = models.DateTimeField(default=now)
	checksum = models.CharField(max_length=256)
	name = models.CharField(max_length=64)
	cube_content = models.TextField()

	class Meta:
		ordering = ('-created_at',)