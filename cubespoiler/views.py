from django.http import HttpResponse, HttpRequest
from rest_framework import status, generics
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from cubespoiler import models
from cubespoiler import serializers
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap
from mtgimg.interface import SizeSlug
from mtgorp.models.persistent.printing import Printing
from mtgorp.tools.parsing.search.parse import SearchParser, ParseException
from mtgorp.tools.search.extraction import CardboardStrategy, PrintingStrategy
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
    queryset = models.CubeContainer.objects.all()
    serializer_class = serializers.CubeContainerSerializer


@api_view(['GET', ])
def cube_view(request: Request, cube_id: int) -> Response:
    try:
        cube_container = models.CubeContainer.objects.get(pk=cube_id)
    except models.CubeContainer.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
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

    if pictured_type == Printing:
        try:
            _id = int(pictured_id)
        except ValueError:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        image = image_loader.get_image(db.printings[_id], size_slug=size_slug)
    else:
        image = image_loader.get_image(picture_name=pictured_id, pictured_type=pictured_type, size_slug=size_slug)

    response = HttpResponse(content_type='image/png')
    image.get().save(response, 'PNG')
    return response


class SearchView(generics.ListAPIView):

    _search_target_map = {
        'printings': (PrintingStrategy, serializers.MinimalPrintingSerializer),
        'cardboards': (CardboardStrategy, serializers.CardboardSerializer),
    }

    def list(self, request, *args, **kwargs):
        try:
            query = self.request.query_params['query']
            search_target = self._search_target_map.get(
                self.request.query_params.get('search_target', 'printings'),
                PrintingStrategy,
            )
        except KeyError:
            return Response('No query', status=status.HTTP_400_BAD_REQUEST)

        search_parser = SearchParser(db)

        try:
            pattern = search_parser.parse(query, PrintingStrategy)
        except ParseException as e:
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)

        # TODO printings aren't really ordered
        return self.get_paginated_response(
            [
                serializers.MinimalPrintingSerializer.serialize(printing)
                for printing in
                self.paginate_queryset(
                    list(
                        pattern.matches(
                            db.printings.values()
                        )
                    )
                )
            ]
        )


def printing_view(request: Request, printing_id: int):
    try:
        printing = db.printings[printing_id]
    except KeyError:
        return Response('No printing with that id', status=status.HTTP_404_NOT_FOUND)

    return Response(
        serializers.FullPrintingSerializer.serialize(printing)
    )