import typing as t

import datetime
import hashlib
import random

from distutils.util import strtobool

from django.http import HttpResponse, HttpRequest
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
# from django.core.mail import send_mail
from django.template.loader import get_template
from django.template.context import Context

from rest_framework import status, generics, permissions, views
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from knox.models import AuthToken

from mtgorp.models.persistent.cardboard import Cardboard
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.strategies.strategy import Strategy
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.tools.parsing.search.parse import SearchParser, ParseException
from mtgorp.tools.search.extraction import CardboardStrategy, PrintingStrategy, ExtractionStrategy

from mtgimg.interface import SizeSlug, ImageFetchException

from magiccube.collections.cube import Cube
from magiccube.collections.nodecollection import NodeCollection, ConstrainedNode
from magiccube.update.cubeupdate import CubePatch
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap, IntentionType
from magiccube.laps.traps.tree.parse import PrintingTreeParser, PrintingTreeParserException
from magiccube.update.cubeupdate import CubeUpdater

from cubeapp import settings

from api import models
from api import serializers
from api.mail import send_mail

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


class CubeReleasesList(generics.ListAPIView):
    queryset = models.CubeRelease.objects.all()
    serializer_class = serializers.CubeReleaseSerializer


class CubeReleaseView(generics.RetrieveAPIView):
    queryset = models.CubeRelease.objects.all()
    serializer_class = serializers.FullCubeReleaseSerializer


@api_view(['GET', ])
def image_view(request: HttpRequest, pictured_id: str) -> HttpResponse:
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
        try:
            image = image_loader.get_image(picture_name=pictured_id, pictured_type=pictured_type,
                                           size_slug=size_slug).get()
        except ImageFetchException:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)

    response = HttpResponse(content_type='image/png')
    image.save(response, 'PNG')
    return response


class SearchView(generics.ListAPIView):
    _search_target_map = {
        'printings': (PrintingStrategy, serializers.MinimalPrintingSerializer),
        'cardboards': (CardboardStrategy, serializers.MinimalCardboardSerializer),
    }  # type: t.Dict[str, t.Tuple[t.Type[ExtractionStrategy], serializers.ModelSerializer]]

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
def filter_release_view(request: Request, pk: int) -> Response:
    try:
        query = request.query_params['query']
    except KeyError:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    try:
        flattened = strtobool(
            request.query_params.get(
                'flattened',
                'False'
            )
        )
    except ValueError:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    search_parser = SearchParser(db)

    try:
        pattern = search_parser.parse(query, PrintingStrategy)
    except ParseException as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)

    try:
        release = models.CubeRelease.objects.get(pk=pk)
    except models.CubeRelease.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    cube = JsonId(db).deserialize(
        Cube,
        release.cube_content
    )

    if flattened:
        cube = Cube(
            cubeables=cube.all_printings,
        )

    return Response(
        serializers.CubeSerializer.serialize(
            cube.filter(
                pattern
            )
        )
    )


def printing_view(request: Request, printing_id: int):
    try:
        printing = db.printings[printing_id]
    except KeyError:
        return Response('No printing with that id', status=status.HTTP_404_NOT_FOUND)

    return Response(
        serializers.FullPrintingSerializer.serialize(printing)
    )


class SignupEndpoint(generics.GenericAPIView):
    serializer_class = serializers.SignupSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)  # type: serializers.SignupSerializer
        serializer.is_valid(raise_exception=True)

        token_hash = hashlib.sha3_256()
        token_hash.update(serializer.validated_data['invite_token'].encode('ASCII'))

        try:
            invite = models.Invite.objects.get(
                key_hash=token_hash.hexdigest(),
                claimed_by=None,
                created_at__gt=datetime.datetime.now() - datetime.timedelta(days=10),
            )
        except models.Invite.DoesNotExist:
            return Response('invalid token', status.HTTP_400_BAD_REQUEST)

        try:
            get_user_model().objects.create_user(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password'],
                email=serializer.validated_data['email'],
            )
        except IntegrityError:
            return Response('User with that username already exists', status=status.HTTP_409_CONFLICT)

        new_user = get_user_model().objects.get(
            username=serializer.validated_data['username']
        )

        invite.claimed_by = new_user
        invite.save()

        _, auth_token = AuthToken.objects.create(new_user)

        return Response(
            {
                "user": serializers.UserSerializer(
                    new_user,
                    context=self.get_serializer_context(),
                ).data,
                "token": auth_token,
            }
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


class InviteUserEndpoint(generics.GenericAPIView):
    serializer_class = serializers.InviteSerializer
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        issuer = request.user

        key = None

        for _ in range(128):
            key = ''.join(
                random.choice('abcdefghijklmnopqrtuvwxyz')
                for _ in
                range(255)
            )

            hasher = hashlib.sha3_256()
            hasher.update(key.encode('ASCII'))
            try:
                models.Invite.objects.create(
                    key_hash=hasher.hexdigest(),
                    email=serializer.validated_data['email'],
                    issued_by=issuer,
                )
                break
            except IntegrityError:
                pass

        if not key:
            raise Exception('Could not generate unique invite key')

        send_mail(
            subject='YOU HAVE BEEN INVITED TO JOIN EXCLUSIVE CLUB!!eleven',
            content=get_template('invite_mail.html').render(
                {
                    'inviter': issuer.username,
                    'invite_link': 'http://{host}/sign-up/?invite_code={key}'.format(
                        host=settings.HOST,
                        key=key,
                    ),
                }
            ),
            recipients=[serializer.validated_data['email'], ]
        )

        return Response(
            status=status.HTTP_200_OK,
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


class PatchList(generics.ListCreateAPIView):
    queryset = models.CubePatch.objects.all()
    serializer_class = serializers.CubePatchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]

    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            content=JsonId.serialize(
                CubePatch()
            ),
        )


class VersionedCubePatchList(generics.ListAPIView):
    serializer_class = serializers.CubePatchSerializer

    def get_queryset(self):
        return models.CubePatch.objects.filter(
            versioned_cube_id=self.kwargs['pk']
        )


class PatchDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.CubePatch.objects.all()
    serializer_class = serializers.CubePatchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]

    def patch(self, request, *args, **kwargs):
        try:
            patch = models.CubePatch.objects.get(pk=kwargs['pk'])
        except models.CubePatch.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            update = JsonId(db).deserialize(
                CubePatch,
                request.data['update'],
            )
        except (KeyError, AttributeError, Exception):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        patch.content = JsonId.serialize(
            JsonId(db).deserialize(
                CubePatch,
                patch.content,
            ) + update
        )
        patch.save()

        return Response(
            serializers.CubePatchSerializer(patch).data,
            content_type='application/json',
        )


@api_view(['GET'])
def patch_preview(request: Request, pk: int) -> Response:
    try:
        patch_model = models.CubePatch.objects.get(pk=pk)
    except models.CubePatch.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    latest_release = patch_model.versioned_cube.latest_release

    # TODO handle no releases in a good way
    current_cube = JsonId(db).deserialize(
        Cube,
        latest_release.cube_content,
    )

    cube_patch = JsonId(db).deserialize(
        CubePatch,
        patch_model.content,
    )

    return Response(
        {
            'cube': serializers.CubeSerializer.serialize(
                current_cube + cube_patch.cube_delta_operation,
            ),
            'nodes': {
                'constrained_nodes_content': serializers.ConstrainedNodesOrpSerializer.serialize(
                    (
                        JsonId(db).deserialize(
                            NodeCollection,
                            latest_release.constrained_nodes.constrained_nodes_content,
                        ) + cube_patch.node_delta_operation
                        if hasattr(latest_release, 'constrained_nodes') else
                        NodeCollection(())
                    )
                )
            },
        },
        content_type='application/json',
    )


class ParseConstrainedNodeEndpoint(generics.GenericAPIView):
    serializer_class = serializers.ParseConstrainedNodeSerializer
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)  # type: serializers.ParseTrapSerializer
        serializer.is_valid(raise_exception=True)

        try:
            constrained_node = ConstrainedNode(
                node=PrintingTreeParser(db).parse(serializer.validated_data['query']),
                groups=[
                    group.rstrip().lstrip()
                    for group in
                    serializer.validated_data['groups'].split(',')
                ],
                value=serializer.validated_data['weight'],
            )
        except PrintingTreeParserException as e:
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            serializers.ConstrainedNodeOrpSerializer.serialize(
                constrained_node
            ),
            status=status.HTTP_200_OK,
            content_type='application/json'
        )


class ParseTrapEndpoint(generics.GenericAPIView):
    serializer_class = serializers.ParseTrapSerializer
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data) #type: serializers.ParseTrapSerializer
        serializer.is_valid(raise_exception=True)

        try:
            intention_type = IntentionType[serializer.validated_data['intention_type']]
        except KeyError:
            intention_type = IntentionType.NO_INTENTION

        try:
            trap = Trap(
                node=PrintingTreeParser(db).parse(serializer.validated_data['query']),
                intention_type=intention_type,
            )
        except PrintingTreeParserException as e:
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            serializers.TrapSerializer.serialize(
                trap
            ),
            status=status.HTTP_200_OK,
            content_type='application/json'
)


class ApplyPatchEndpoint(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request, pk: int, *args, **kwargs):
        try:
            patch = models.CubePatch.objects.get(pk=pk)
        except models.CubePatch.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        versioned_cube = patch.versioned_cube
        latest_release = versioned_cube.latest_release

        cube = JsonId(db).deserialize(Cube, latest_release.cube_content)
        cube_patch = JsonId(db).deserialize(CubePatch, patch.content)

        # cube_updater = CubeUpdater(
        #     cube = cube,
        #     node_collection = NodeCollection(()),
        #     patch = cube_patch,
        # ).update()

        new_release = models.CubeRelease.create(
            cube + cube_patch.cube_delta_operation,
            versioned_cube,
        )

        if hasattr(latest_release, 'constrained_nodes'):
            models.ConstrainedNodes.objects.create(
                constrained_nodes_content = JsonId.serialize(
                    JsonId(db).deserialize(
                        NodeCollection,
                        latest_release.constrained_nodes.constrained_nodes_content,
                    ) + cube_patch.node_delta_operation
                ),
                release = new_release,
            )

        patch.delete()

        return Response(
            serializers.FullCubeReleaseSerializer(new_release).data,
            status=status.HTTP_200_OK,
        )


class CreateRevertPatchEndpoint(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request, *args, **kwargs):
        pass


class ConstrainedNodesList(generics.ListAPIView):
    queryset = models.ConstrainedNodes.objects.all()
    serializer_class = serializers.ConstrainedNodesSerializer
