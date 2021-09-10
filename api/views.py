import string
import typing as t
import datetime
import hashlib
import random
from distutils.util import strtobool

from django.contrib.auth.backends import UserModel
from django.db import transaction
from django.db.models import Prefetch
from django.http import HttpResponse, HttpRequest, JsonResponse
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from django.template.loader import get_template

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from knox.models import AuthToken

from mtgorp.models.persistent.attributes.expansiontype import ExpansionType
from mtgorp.models.persistent.cardboard import Cardboard
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.strategies.raw import RawStrategy
from mtgorp.tools.parsing.search.parse import SearchParser, ParseException
from mtgorp.tools.search.extraction import CardboardStrategy, PrintingStrategy, ExtractionStrategy

from mtgimg.interface import SizeSlug, ImageFetchException, ImageRequest

from magiccube.collections.cube import Cube
from magiccube.collections.infinites import Infinites
from magiccube.collections.nodecollection import NodeCollection, ConstrainedNode, GroupMap
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap, IntentionType
from magiccube.laps.traps.tree.parse import PrintingTreeParser, PrintingTreeParserException
from magiccube.tools.cube_difference import cube_difference
from magiccube.update.cubeupdate import CubePatch, CubeUpdater
from magiccube.update.report import UpdateReport

from api import models
from api.mail import send_mail
from api.serialization import orpserialize
from api.serialization import serializers
from cubeapp import settings
from resources.staticdb import db
from resources.staticimageloader import image_loader
from utils.values import JAVASCRIPT_DATETIME_FORMAT


_CUBEABLES_TYPE_MAP = {
    'printing': Printing,
    'trap': Trap,
    'ticket': Ticket,
    'purple': Purple,
    'cardboard': Cardboard,
}

_IMAGE_SIZE_MAP = {
    size_slug.name.lower(): size_slug
    for size_slug in
    SizeSlug
}


@api_view(['GET'])
def db_info(request: HttpRequest) -> HttpResponse:
    return JsonResponse(
        {
            'created_at': db.created_at.strftime(JAVASCRIPT_DATETIME_FORMAT),
            'json_updated_at': db.json_version.strftime(JAVASCRIPT_DATETIME_FORMAT),
            'last_expansion_name': sorted(
                filter(lambda e: e.expansion_type == ExpansionType.SET, db.expansions.values()),
                key = lambda e: e.release_date
            )[-1].name,
            'checksum': db.checksum.hex(),
        }
    )


@api_view(['GET'])
def min_supported_client_version(request: HttpRequest) -> HttpResponse:
    return JsonResponse(
        {
            'version': '0.1.3',
        }
    )


class CubeReleaseView(generics.RetrieveAPIView):
    queryset = models.CubeRelease.objects.select_related(
        'versioned_cube',
        'versioned_cube__author',
        'constrained_nodes',
    ).prefetch_related(
        'image_bundles',
    ).all()
    serializer_class = serializers.FullCubeReleaseSerializer


@api_view(['GET'])
def image_view(request: HttpRequest, pictured_id: str) -> HttpResponse:
    pictured_type = _CUBEABLES_TYPE_MAP.get(
        request.GET.get(
            'type',
            'printing',
        ).lower(),
        Printing,
    )
    size_slug = _IMAGE_SIZE_MAP.get(
        request.GET.get(
            'size_slug',
            'original',
        ),
        SizeSlug.ORIGINAL,
    )

    cropped = strtobool(request.GET.get('cropped') or '0')
    back = strtobool(request.GET.get('back') or '0')

    if pictured_id == 'back':
        image = image_loader.get_default_image(size_slug = size_slug, crop = cropped)
    else:
        if pictured_type == Cardboard:
            try:
                cardboard = db.cardboards[pictured_id.replace('_', '/')]
            except KeyError:
                return HttpResponse(status = status.HTTP_404_NOT_FOUND)

            image_request = ImageRequest(
                max(
                    cardboard.printings,
                    key = lambda p: p.expansion.release_date
                ),
                size_slug = size_slug,
                crop = cropped,
            )

        elif pictured_type == Printing:
            try:
                _id = int(pictured_id)
            except ValueError:
                return HttpResponse(status = status.HTTP_400_BAD_REQUEST)
            try:
                printing = db.printings[_id]
            except KeyError:
                return HttpResponse(status = status.HTTP_404_NOT_FOUND)
            image_request = ImageRequest(printing, size_slug = size_slug, crop = cropped, back = back)

        else:
            image_request = ImageRequest(
                picture_name = pictured_id,
                pictured_type = pictured_type,
                size_slug = size_slug,
                crop = cropped,
                back = back,
            )
        try:
            image = image_loader.get_image(
                image_request = image_request
            ).get()
        except ImageFetchException:
            return HttpResponse(status = status.HTTP_404_NOT_FOUND)

    response = HttpResponse(content_type = 'image/png')
    image.save(response, 'PNG')
    return response


class SearchView(generics.ListAPIView):
    _search_target_map: t.Dict[
        t.Tuple[str, bool],
        t.Tuple[t.Type[ExtractionStrategy], orpserialize.ModelSerializer],
    ] = {
        ('printings', False): (PrintingStrategy, orpserialize.FullPrintingSerializer),
        ('cardboards', False): (CardboardStrategy, orpserialize.MinimalCardboardSerializer),
        ('printings', True): (PrintingStrategy, orpserialize.PrintingIdSerializer),
        ('cardboards', True): (CardboardStrategy, orpserialize.CardboardIdSerializer),
    }

    def list(self, request, *args, **kwargs):
        try:
            query = self.request.query_params['query']
            native = strtobool(self.request.query_params.get('native', 'False'))
            strategy, serializer = self._search_target_map[
                (
                    self.request.query_params.get('search_target', 'printings'),
                    native,
                )
            ]

            _sort_keys: t.Dict[str, t.Callable[[t.Union[Printing, Cardboard]], t.Any]] = {
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
            }

            order_by = _sort_keys[
                self.request.query_params.get('order_by', 'name')
            ]
            descending = strtobool(self.request.query_params.get('descending', 'false'))

        except (KeyError, ValueError):
            return Response(status = status.HTTP_400_BAD_REQUEST)

        search_parser = SearchParser(db)

        try:
            pattern = search_parser.parse(query, strategy)
        except ParseException as e:
            return Response(str(e), status = status.HTTP_400_BAD_REQUEST)

        printings = pattern.matches(
            db.printings.values()
            if strategy == PrintingStrategy else
            db.cardboards.values()
        )

        if order_by != _sort_keys['name']:
            printings = sorted(
                printings,
                key = _sort_keys['name'],
            )

        printings = sorted(
            printings,
            key = order_by,
            reverse = descending,
        )

        response = self.get_paginated_response(
            [
                serializer.serialize(printing)
                for printing in
                self.paginate_queryset(
                    printings
                )
            ]
        )

        response.data['query_explained'] = pattern.matchable.explain()
        return response


@api_view(['GET'])
def filter_release_view(request: Request, pk: int) -> Response:
    try:
        query = request.query_params['query']
    except KeyError:
        return Response(status = status.HTTP_400_BAD_REQUEST)

    try:
        flattened = strtobool(
            request.query_params.get(
                'flattened',
                'False',
            )
        )
    except ValueError:
        return Response(status = status.HTTP_400_BAD_REQUEST)

    search_parser = SearchParser(db)

    try:
        pattern = search_parser.parse(query, PrintingStrategy)
    except ParseException as e:
        return Response(str(e), status = status.HTTP_400_BAD_REQUEST)

    try:
        release = models.CubeRelease.objects.get(pk = pk)
    except models.CubeRelease.DoesNotExist:
        return Response(status = status.HTTP_404_NOT_FOUND)

    if flattened:
        cube = Cube(
            cubeables = release.cube.all_printings,
        )
    else:
        cube = release.cube

    return Response(
        orpserialize.CubeSerializer.serialize(
            cube.filter(
                pattern
            )
        )
    )


def printing_view(request: Request, printing_id: int):
    try:
        printing = db.printings[printing_id]
    except KeyError:
        return Response('No printing with that id', status = status.HTTP_404_NOT_FOUND)

    return Response(
        orpserialize.FullPrintingSerializer.serialize(printing)
    )


class SignupEndpoint(generics.GenericAPIView):
    serializer_class = serializers.SignupSerializer

    def post(self, request, *args, **kwargs):
        serializer: serializers.SignupSerializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        token_hash = hashlib.sha3_256()
        token_hash.update(serializer.validated_data['invite_token'].encode('ASCII'))

        try:
            invite = models.Invite.objects.get(
                key_hash = token_hash.hexdigest(),
                claimed_by = None,
                created_at__gt = datetime.datetime.now() - datetime.timedelta(days = 10),
            )
        except models.Invite.DoesNotExist:
            return Response('invalid token', status.HTTP_400_BAD_REQUEST)

        try:
            new_user = get_user_model().objects.create_user(
                username = serializer.validated_data['username'],
                password = serializer.validated_data['password'],
                email = serializer.validated_data['email'],
            )
        except IntegrityError:
            return Response('User with that username already exists', status = status.HTTP_409_CONFLICT)

        invite.claimed_by = new_user
        invite.save()

        _, auth_token = AuthToken.objects.create(new_user)

        return Response(
            {
                "user": serializers.UserSerializer(
                    new_user,
                    context = self.get_serializer_context(),
                ).data,
                "token": auth_token,
            }
        )


class LoginEndpoint(generics.GenericAPIView):
    serializer_class = serializers.LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)
        user = serializer.validated_data

        _, token = AuthToken.objects.create(user)

        return Response(
            {
                "user": serializers.UserSerializer(
                    user,
                    context = self.get_serializer_context(),
                ).data,
                "token": token,
            }
        )


class ResetPassword(generics.GenericAPIView):
    serializer_class = serializers.ResetSerializer

    def post(self, request, *args, **kwargs):
        serializer: serializers.ResetSerializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        try:
            user = get_user_model().objects.get(
                username = serializer.validated_data['username'],
                email = serializer.validated_data['email'],
            )
        except (UserModel.DoesNotExist, UserModel.MultipleObjectsReturned):
            return Response('Invalid user', status = status.HTTP_400_BAD_REQUEST)

        if models.PasswordReset.objects.filter(
            user = user,
            created_at__gte = datetime.datetime.now() - datetime.timedelta(hours = 1),
        ).count() >= 2:
            return Response('To many password resets, try again later', status = status.HTTP_400_BAD_REQUEST)

        reset = models.PasswordReset.create(user)

        send_mail(
            subject = 'Password reset',
            content = get_template('reset_mail.html').render(
                {
                    'reset_link': '{host}/claim-password-reset/?code={code}'.format(
                        host = settings.HOST,
                        code = reset.code,
                    ),
                }
            ),
            recipients = [user.email],
        )

        return Response(status = status.HTTP_200_OK)


class ClaimReset(generics.GenericAPIView):
    serializer_class = serializers.ClaimResetSerializer

    def post(self, request, *args, **kwargs):
        serializer: serializers.ClaimResetSerializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        reset: models.PasswordReset = models.PasswordReset.objects.filter(
            code = serializer.validated_data['code'],
            claimed = False,
            created_at__gte = datetime.datetime.now() - datetime.timedelta(hours = 1),
        ).order_by('created_at').last()

        if reset is None:
            return Response('Invalid code', status = status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            reset.user.set_password(serializer.validated_data['new_password'])
            reset.user.save()
            reset.claimed = True
            reset.save(update_fields = ('claimed',))

        return Response(status = status.HTTP_200_OK)


class InviteUserEndpoint(generics.GenericAPIView):
    serializer_class = serializers.InviteSerializer
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        issuer = request.user

        key = None

        for _ in range(128):
            key = ''.join(
                random.choice(string.ascii_letters)
                for _ in
                range(255)
            )

            hasher = hashlib.sha3_256()
            hasher.update(key.encode('ASCII'))
            try:
                models.Invite.objects.create(
                    key_hash = hasher.hexdigest(),
                    email = serializer.validated_data['email'],
                    issued_by = issuer,
                )
                break
            except IntegrityError:
                pass

        if not key:
            raise Exception('Could not generate unique invite key')

        send_mail(
            subject = 'YOU HAVE BEEN INVITED TO JOIN EXCLUSIVE CLUB!!eleven',
            content = get_template('invite_mail.html').render(
                {
                    'inviter': issuer.username,
                    'invite_link': '{host}/sign-up/?invite_code={key}'.format(
                        host = settings.HOST,
                        key = key,
                    ),
                }
            ),
            recipients = [serializer.validated_data['email'], ]
        )

        return Response(
            status = status.HTTP_200_OK,
        )


class UserEndpoint(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, ]
    serializer_class = serializers.UserSerializer

    def get_object(self):
        return self.request.user


class VersionedCubesList(generics.ListCreateAPIView):
    queryset = models.VersionedCube.objects.select_related(
        'author',
    ).prefetch_related(
        Prefetch(
            'releases',
            queryset = models.CubeRelease.objects.all().only(
                'id',
                'name',
                'created_at',
                'checksum',
                'intended_size',
                'versioned_cube_id',
            )
        ),
    ).all().order_by('created_at')
    serializer_class = serializers.VersionedCubeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]

    def perform_create(self, serializer):
        with transaction.atomic():
            versioned_cube = serializer.save(author = self.request.user)
            release = models.CubeRelease.create(
                cube = Cube(),
                versioned_cube = versioned_cube,
                infinites = Infinites(
                    (
                        db.cardboards[c]
                        for c in
                        (
                            'Plains',
                            'Island',
                            'Swamp',
                            'Mountain',
                            'Forest',
                        )
                    )
                ),
            )
            models.ConstrainedNodes.objects.create(
                constrained_nodes = NodeCollection(()),
                group_map = GroupMap({}),
                release = release,
            )


class VersionedCubeDetail(generics.RetrieveDestroyAPIView):
    queryset = models.VersionedCube.objects.select_related(
        'author',
    ).prefetch_related(
        Prefetch(
            'releases',
            queryset = models.CubeRelease.objects.all().only(
                'id',
                'name',
                'created_at',
                'checksum',
                'intended_size',
                'versioned_cube_id',
            )
        ),
    ).all()
    serializer_class = serializers.VersionedCubeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class ForkVersionedCube(generics.CreateAPIView):
    queryset = models.VersionedCube.objects.all()
    serializer_class = serializers.VersionedCubeSerializer
    permission_classes = [permissions.IsAuthenticated, ]

    def perform_create(self, serializer):
        forked_versioned_cube: models.VersionedCube = self.get_object()

        with transaction.atomic():
            new_versioned_cube = serializer.save(
                author = self.request.user,
                forked_from_release = forked_versioned_cube.latest_release,
            )

            release = models.CubeRelease.create(
                cube = forked_versioned_cube.latest_release.cube,
                versioned_cube = new_versioned_cube,
                infinites = forked_versioned_cube.latest_release.infinites,
            )
            models.ConstrainedNodes.objects.create(
                constrained_nodes = forked_versioned_cube.latest_release.constrained_nodes.constrained_nodes,
                group_map = forked_versioned_cube.latest_release.constrained_nodes.group_map,
                release = release,
            )


class UserList(generics.ListAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = serializers.UserSerializer


class UserDetail(generics.RetrieveAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = serializers.FullUserSerializer


class PersonalUserDetail(generics.RetrieveUpdateAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = serializers.FullUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PatchList(generics.ListCreateAPIView):
    queryset = models.CubePatch.objects.all()
    serializer_class = serializers.CubePatchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]

    def perform_create(self, serializer):
        serializer.save(
            author = self.request.user,
            patch = CubePatch(),
        )


class VersionedCubePatchList(generics.ListAPIView):
    serializer_class = serializers.CubePatchSerializer

    def get_queryset(self):
        return models.CubePatch.objects.filter(
            versioned_cube_id = self.kwargs['pk']
        )


class PatchDetail(generics.RetrieveDestroyAPIView):
    queryset = models.CubePatch.objects.all()
    serializer_class = serializers.CubePatchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


@api_view(['GET'])
def patch_verbose(request: Request, pk: int) -> Response:
    try:
        patch = models.CubePatch.objects.get(pk = pk)
    except models.CubePatch.DoesNotExist:
        return Response(status = status.HTTP_404_NOT_FOUND)

    latest_release = patch.versioned_cube.latest_release

    native = strtobool(request.query_params.get('native', '0'))

    return Response(
        (
            RawStrategy
            if native else
            orpserialize.VerbosePatchSerializer
        ).serialize(
            patch.patch.as_verbose(
                latest_release.as_meta_cube()
            )
        )
    )


@api_view(['GET'])
def patch_preview(request: Request, pk: int) -> Response:
    try:
        patch = models.CubePatch.objects.get(pk = pk)
    except models.CubePatch.DoesNotExist:
        return Response(status = status.HTTP_404_NOT_FOUND)

    latest_release = models.CubeRelease.objects.filter(
        versioned_cube__patches = patch
    ).select_related(
        'constrained_nodes',
    ).order_by('created_at').last()

    native = strtobool(request.query_params.get('native', '0'))

    return Response(
        (
            RawStrategy
            if native else
            orpserialize.MetaCubeSerializer
        ).serialize(
            latest_release.as_meta_cube() + patch.patch,
        ),
        content_type = 'application/json',
    )


@api_view(['GET'])
def patch_report(request: Request, pk: int) -> Response:
    try:
        patch_model = models.CubePatch.objects.get(pk = pk)
    except models.CubePatch.DoesNotExist:
        return Response(status = status.HTTP_404_NOT_FOUND)

    latest_release = patch_model.versioned_cube.latest_release

    return Response(
        orpserialize.UpdateReportSerializer.serialize(
            UpdateReport(
                CubeUpdater(
                    meta_cube = latest_release.as_meta_cube(),
                    patch = patch_model.patch,
                )
            )
        )
    )


class ForkPatch(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]

    def post(self, request, *args, **kwargs):
        try:
            patch_model = models.CubePatch.objects.get(pk = kwargs['pk'])
        except models.CubePatch.DoesNotExist:
            return Response(status = status.HTTP_404_NOT_FOUND)

        return Response(
            serializers.CubePatchSerializer(
                models.CubePatch.objects.create(
                    description = f'Forked from {patch_model.name}',
                    patch = patch_model.patch,
                    versioned_cube = patch_model.versioned_cube,
                    author = request.user,
                    forked_from = patch_model,
                )
            ).data,
            status = status.HTTP_201_CREATED,
        )


class ListDistributionPossibilities(generics.ListAPIView):

    def list(self, request, *args, **kwargs):
        return self.get_paginated_response(
            [
                serializers.DistributionPossibilitySerializer(
                    possibility,
                    context = {'request': request},
                ).data
                for possibility in
                self.paginate_queryset(
                    models.DistributionPossibility.objects.filter(
                        patch_id = kwargs['pk']
                    ).order_by('-created_at')
                )
            ]
        )


@api_view(['GET'])
def sample_pack(request: Request, pk: int, size: int) -> Response:
    try:
        release = models.CubeRelease.objects.get(pk = pk)
    except models.CubePatch.DoesNotExist:
        return Response(status = status.HTTP_404_NOT_FOUND)

    r = random.Random()
    seed = request.GET.get('seed') or ''.join(
        random.choice(string.ascii_letters)
        for _ in
        range(16)
    )
    r.seed(seed)

    try:
        return Response(
            {
                'pack': orpserialize.CubeSerializer.serialize(
                    Cube(r.sample(sorted(release.cube.cubeables, key = lambda p: str(p.id)), size))
                ),
                'seed': seed,
            }
        )
    except ValueError:
        return Response('Pack to large', status = status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def release_delta(request: Request, to_pk: int, from_pk: int) -> Response:
    try:
        to_release = models.CubeRelease.objects.get(pk = to_pk)
        from_release = models.CubeRelease.objects.get(pk = from_pk)
    except models.CubePatch.DoesNotExist:
        return Response(status = status.HTTP_404_NOT_FOUND)

    if from_release.created_at >= to_release.created_at:
        return Response(status = status.HTTP_400_BAD_REQUEST)

    from_meta_cube = from_release.as_meta_cube()
    to_meta_cube = to_release.as_meta_cube()

    cube_patch = CubePatch.from_meta_delta(from_meta_cube, to_meta_cube)

    try:
        pdf_url = models.LapChangePdf.objects.get(
            original_release_id = from_pk,
            resulting_release_id = to_pk,
        ).pdf_url
    except models.LapChangePdf.DoesNotExist:
        pdf_url = None

    return Response(
        {
            'patch': orpserialize.CubePatchOrpSerializer.serialize(
                cube_patch
            ),
            'verbose_patch': orpserialize.VerbosePatchSerializer.serialize(
                cube_patch.as_verbose(from_meta_cube)
            ),
            'pdf_url': pdf_url,
            'report': orpserialize.UpdateReportSerializer.serialize(
                UpdateReport(
                    CubeUpdater(from_meta_cube, cube_patch)
                )
            ),
            'difference': cube_difference(from_meta_cube, to_meta_cube),
        }
    )


class ParseConstrainedNodeEndpoint(generics.GenericAPIView):
    serializer_class = serializers.ParseConstrainedNodeSerializer
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request, *args, **kwargs):
        serializer: serializers.ParseTrapSerializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        value = serializer.validated_data.get('weight', 1)

        try:
            constrained_node = ConstrainedNode(
                node = PrintingTreeParser(
                    db,
                    allow_volatile = True,
                ).parse(
                    serializer.validated_data['query']
                ),
                groups = [
                    group.rstrip().lstrip()
                    for group in
                    serializer.validated_data.get('groups', '').split(',')
                ],
                value = value if value is not None else 1,
            )
        except PrintingTreeParserException as e:
            return Response(str(e), status = status.HTTP_400_BAD_REQUEST)

        return Response(
            orpserialize.ConstrainedNodeOrpSerializer.serialize(
                constrained_node
            ),
            status = status.HTTP_200_OK,
            content_type = 'application/json'
        )


class ParseTrapEndpoint(generics.GenericAPIView):
    serializer_class = serializers.ParseTrapSerializer
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request, *args, **kwargs):
        serializer: serializers.ParseTrapSerializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        try:
            intention_type = IntentionType[serializer.validated_data['intention_type']]
        except KeyError:
            intention_type = IntentionType.NO_INTENTION

        try:
            trap = Trap(
                node = PrintingTreeParser(
                    db,
                    allow_volatile = True,
                ).parse(serializer.validated_data['query']),
                intention_type = intention_type,
            )
        except PrintingTreeParserException as e:
            return Response(str(e), status = status.HTTP_400_BAD_REQUEST)

        return Response(
            orpserialize.TrapSerializer.serialize(
                trap
            ),
            status = status.HTTP_200_OK,
            content_type = 'application/json'
        )


@api_view(['GET'])
def random_printing(request: Request) -> Response:
    return Response(
        data = orpserialize.FullPrintingSerializer.serialize(
            random.choice(
                list(
                    random.choice(
                        [
                            cardboard
                            for cardboard in db.cardboards.values()
                            if cardboard.latest_printing.expansion.expansion_type != ExpansionType.FUNNY
                        ]
                    ).printings
                )
            )
        ),
        status = status.HTTP_200_OK,
    )


@api_view(['GET'])
def cube_cubeable(request: Request, pk: int, cubeable_type: str, cubeable_id: str) -> Response:
    print(request.data, pk, cubeable_type, cubeable_id)
    try:
        cubeable_type = _CUBEABLES_TYPE_MAP[cubeable_type.lower()]
    except KeyError:
        return Response('Invalid cubeable type', status = status.HTTP_400_BAD_REQUEST)

    return Response('ok', status = status.HTTP_200_OK)
