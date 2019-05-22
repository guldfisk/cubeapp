from django.shortcuts import render
from django.http import HttpResponse, HttpRequest, JsonResponse

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status

from magiccube.collections.cube import Cube

from mtgimg.interface import ImageRequest

from resources.staticdb import db
from resources.staticimageloader import image_loader
from cubespoiler.serializers import CubeContainerSerializer, FullCubeContainerSerializer
from cubespoiler import models


@api_view(['GET',])
def index(request: Request) -> Response:
	cubes = models.CubeContainer.objects.all()
	serializer = CubeContainerSerializer(cubes, many=True)
	return Response(serializer.data)


@api_view(['GET',])
def cube_view(request: Request, cube_id: int) -> Response:
	try:
		cube_container = models.CubeContainer.objects.get(pk=cube_id)
	except models.CubeContainer.DoesNotExist:
		return Response(status=status.HTTP_404_NOT_FOUND)

	if request.method == 'GET':
		serializer = FullCubeContainerSerializer(cube_container)
		return Response(serializer.data)


def image_view(request: HttpRequest, printing_id: int) -> HttpResponse:
	# image_request = ImageRequest(printing_id)
	image = image_loader.get_image(db.printings[printing_id])
	response = HttpResponse(content_type='image/png')
	image.get().save(response, 'PNG')
	return response


def test(request: HttpRequest) -> HttpResponse:
	cardboard = db.cardboards['Fire // Ice']
	return HttpResponse(f'Hm: "{cardboard.name}"')