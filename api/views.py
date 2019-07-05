import typing as t

import json
from distutils.util import strtobool

from django.http import HttpResponse, HttpRequest
from django.contrib.auth import get_user_model

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from knox.models import AuthToken

from mtgorp.models.persistent.cardboard import Cardboard
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.tools.parsing.search.parse import SearchParser, ParseException
from mtgorp.tools.search.extraction import CardboardStrategy, PrintingStrategy, ExtractionStrategy

from mtgimg.interface import SizeSlug

from magiccube.collections.cube import Cube
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap

from api import models
from api import serializers

from resources.staticdb import db
from resources.staticimageloader import image_loader


_IMAGE_TYPES_MAP = {
    'printing': Printing,
    'trap': Trap,
    'ticket': Ticket,
    'purple': Purple,
}

_IMAGE_SIZE_MAP = {
    size_slug.name.lower(): size_slug
    for size_slug in
    SizeSlug
}


class CubesView(generics.ListAPIView):
    queryset = models.CubeRelease.objects.all()
    serializer_class = serializers.CubeContainerSerializer


@api_view(['GET', ])
def cube_view(request: Request, cube_id: int) -> Response:
    try:
        cube_container = models.CubeRelease.objects.get(pk=cube_id)
    except models.CubeRelease.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    serializer = serializers.FullCubeContainerSerializer(cube_container)
    return Response(serializer.data, content_type='application/json')


def image_view(request: HttpRequest, pictured_id: str) -> HttpResponse:
    if not request.method == 'GET':
        return HttpResponse(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    pictured_type = _IMAGE_TYPES_MAP.get(
        request.GET.get(
            'type',
            'printing',
        ),
        Printing,
    )
    size_slug = _IMAGE_SIZE_MAP.get(
        request.GET.get(
            'size_slug',
            'original',
        ),
        SizeSlug.ORIGINAL,
    )

    if pictured_id == 'back':
        image = image_loader.get_default_image(size_slug=size_slug)

    elif pictured_type == Printing:
        try:
            _id = int(pictured_id)
        except ValueError:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        image = image_loader.get_image(db.printings[_id], size_slug=size_slug).get()
    else:
        image = image_loader.get_image(picture_name=pictured_id, pictured_type=pictured_type, size_slug=size_slug).get()

    response = HttpResponse(content_type='image/png')
    image.save(response, 'PNG')
    return response


class SearchView(generics.ListAPIView):

    _search_target_map = {
        'printings': (PrintingStrategy, serializers.MinimalPrintingSerializer),
        'cardboards': (CardboardStrategy, serializers.MinimalCardboardSerializer),
    } #type: t.Dict[str, t.Tuple[t.Type[ExtractionStrategy], serializers.ModelSerializer]]

    def list(self, request, *args, **kwargs):
        try:
            query = self.request.query_params['query']
            strategy, serializer = self._search_target_map[
                self.request.query_params.get('search_target', 'printings')
            ]

            _sort_keys = {
                'name': lambda model: tuple(strategy.extract_name(model)),
                'cmc': lambda model: tuple(strategy.extract_cmc(model)),
                'power': lambda model: tuple(strategy.extract_power(model)),
                'toughness': lambda model: tuple(strategy.extract_toughness(model)),
                'loyalty': lambda model: tuple(strategy.extract_loyalty(model)),
                'artist': lambda model: tuple(strategy.extract_artist(model)),
                'release_date': lambda model: tuple(
                    expansion.release_date
                    for expansion in
                    strategy.extract_expansion(model)
                ),
            }  # type: t.Dict[str, t.Callable[[t.Union[Printing, Cardboard]], t.Any]]

            order_by = _sort_keys[
                self.request.query_params.get('order_by', 'name')
            ]
            descending = strtobool(self.request.query_params.get('descending', 'false'))

        except (KeyError, ValueError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        search_parser = SearchParser(db)

        try:
            pattern = search_parser.parse(query, strategy)
        except ParseException as e:
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)

        return self.get_paginated_response(
            [
                serializer.serialize(printing)
                for printing in
                self.paginate_queryset(
                    sorted(
                        pattern.matches(
                            db.printings.values()
                            if strategy == PrintingStrategy else
                            db.cardboards.values()
                        ),
                        key=order_by,
                        reverse=descending,
                    )
                )
            ]
        )


@api_view(['GET'])
def search_cube_view(request: Request, cube_id: int) -> Response:
    try:
        query = request.query_params['query']
    except KeyError:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    search_parser = SearchParser(db)

    try:
        pattern = search_parser.parse(query, PrintingStrategy)
    except ParseException as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)

    try:
        cube_container = models.CubeRelease.objects.get(pk=cube_id)
    except models.CubeRelease.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    mock_container = models.CubeRelease(
        id = cube_container.id,
        name = cube_container.name,
        created_at = cube_container.created_at,
        checksum = '',
        cube_content = JsonId.serialize(
            Cube(
                printings=pattern.matches(
                    JsonId(db).deserialize(
                        Cube,
                        cube_container.cube_content
                    ).all_printings
                )
            )
        )
    )

    serializer = serializers.FullCubeContainerSerializer(mock_container)
    return Response(serializer.data)


def printing_view(request: Request, printing_id: int):
    try:
        printing = db.printings[printing_id]
    except KeyError:
        return Response('No printing with that id', status=status.HTTP_404_NOT_FOUND)

    return Response(
        serializers.FullPrintingSerializer.serialize(printing)
    )


class LoginEndpoint(generics.GenericAPIView):
    serializer_class = serializers.LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data

        _, token = AuthToken.objects.create(user)

        return Response(
            {
                "user": serializers.UserSerializer(
                    user,
                    context=self.get_serializer_context(),
                ).data,
                "token": token,
            }
        )


class UserEndpoint(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, ]
    serializer_class = serializers.UserSerializer

    def get_object(self):
        return self.request.user


class VersionedCubesList(generics.ListCreateAPIView):
    queryset = models.VersionedCube.objects.all()
    serializer_class = serializers.VersionedCubeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class VersionedCubeDetail(generics.RetrieveDestroyAPIView):
    queryset = models.VersionedCube.objects.all()
    serializer_class = serializers.VersionedCubeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class UserList(generics.ListAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = serializers.UserSerializer


class UserDetail(generics.RetrieveAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = serializers.UserSerializer


class DeltaList(generics.ListCreateAPIView):
    queryset = models.CubeDelta.objects.all()
    serializer_class = serializers.CubeDeltaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
