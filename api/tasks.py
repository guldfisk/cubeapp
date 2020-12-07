import os
import typing as t
import tempfile
import itertools
import functools
import zipfile
from collections import defaultdict
from contextlib import ExitStack
from urllib.parse import urljoin

from boto3 import session
from botocore.client import BaseClient
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer

from django.conf import settings

from proxypdf.streamwriter import StreamProxyWriter

from mtgorp.models.persistent.printing import Printing
from mtgorp.models.persistent.cardboard import Cardboard
from mtgorp.managejson.update import MTG_JSON_DATETIME_FORMAT, get_last_db_update, check_and_update, get_update_db

from mtgimg.interface import SizeSlug, ImageRequest
from mtgimg.pipeline import ImageableProcessor

from magiccube.collections.laps import TrapCollection

from api import models
from api.mail import mail_me

from resources.staticimageloader import image_loader
from utils.boto import MultipartUpload


SPACES_REGION = 'fra1'
SPACES_ENDPOINT = 'https://phdk.fra1.digitaloceanspaces.com/'


def get_boto_client() -> BaseClient:
    boto_session = session.Session()
    return boto_session.client(
        's3',
        region_name = SPACES_REGION,
        endpoint_url = SPACES_ENDPOINT,
        aws_access_key_id = settings.SPACES_PUBLIC_KEY,
        aws_secret_access_key = settings.SPACES_SECRET_KEY,
    )


def inject_boto_client(f: t.Callable) -> t.Callable:
    @functools.wraps(f)
    def wrapper(*args, **kwargs) -> t.Any:
        kwargs['client'] = get_boto_client()
        return f(*args, **kwargs)

    return wrapper


@shared_task()
def check_mtg_json():
    update_db = get_update_db()
    current_db_json_version = get_last_db_update(update_db = update_db)
    if check_and_update(update_db = update_db):
        new_db_version = get_last_db_update(update_db = update_db)
        mail_me(
            'db out of date',
            '<p>Current version: {}</p><p>Previous version: {}</p>'.format(
                new_db_version.strftime(MTG_JSON_DATETIME_FORMAT) if new_db_version else "None",
                current_db_json_version.strftime(MTG_JSON_DATETIME_FORMAT) if current_db_json_version else "None"
            ),
        )


@shared_task()
def generate_release_images(cube_release_id: int):
    try:
        release = models.CubeRelease.objects.get(pk = cube_release_id)
    except models.CubeRelease.DoesNotExist:
        return

    for lap, size_slug in itertools.product(release.cube.laps.distinct_elements(), SizeSlug):
        ImageableProcessor.get_image(ImageRequest(lap, size_slug = size_slug, cache_only = True), image_loader)


@shared_task()
@inject_boto_client
def generate_distribution_pdf(
    patch_id: int,
    possibility_id: int,
    size_slug: SizeSlug = SizeSlug.MEDIUM,
    include_changes_pdf: bool = False,
    *,
    client: BaseClient = None,
):
    possibility = models.DistributionPossibility.objects.get(pk = possibility_id)

    original_trap_collection = TrapCollection(possibility.release.cube.garbage_traps)

    pdfs = (
        ('all', possibility.trap_collection, 'pdf_url'),
    )

    if include_changes_pdf:
        pdfs += (
            ('added', possibility.trap_collection - original_trap_collection, 'added_pdf_url'),
            ('removed', original_trap_collection - possibility.trap_collection, 'removed_pdf_url'),
        )

    with ExitStack() as context_stack:
        storage_keys = [
            f'distributions/{possibility.trap_collection.persistent_hash()}_{name}.pdf'
            for name, _, _ in
            pdfs
        ]
        uploaders = [
            context_stack.enter_context(
                MultipartUpload(
                    client,
                    bucket = 'phdk',
                    key = key,
                    acl = 'public-read',
                )
            ) for key in
            storage_keys
        ]

        writers = [
            context_stack.enter_context(
                StreamProxyWriter(
                    uploader,
                    close_stream = False,
                )
            ) for uploader in
            uploaders
        ]

        for trap in (
            possibility.trap_collection.traps.distinct_elements()
            | original_trap_collection.traps.distinct_elements()
        ):
            image = ImageableProcessor.get_image(ImageRequest(trap, size_slug = size_slug, save = False), image_loader)
            for writer, (_, pdf_trap_collection, _) in zip(writers, pdfs):
                writer.add_proxy(image, pdf_trap_collection.traps.elements().get(trap, 0))

    urls = {}

    for storage_key, (name, _, url_attribute_name) in zip(storage_keys, pdfs):
        pdf_url = urljoin(SPACES_ENDPOINT, 'phdk/' + storage_key)

        urls[url_attribute_name] = pdf_url

        setattr(
            possibility,
            url_attribute_name,
            pdf_url,
        )

    possibility.save(update_fields = [url_attribute_name for _, _, url_attribute_name in pdfs])

    content = {
        'type': 'distribution_pdf_update',
        'possibility_id': possibility_id,
    }

    content.update(urls)

    async_to_sync(get_channel_layer().group_send)(
        f'distributor_{patch_id}',
        content,
    )


@shared_task()
def generate_release_lap_delta_pdf(from_release_id: int, to_release_id: int):
    try:
        from_release = models.CubeRelease.objects.get(pk = from_release_id)
        to_release = models.CubeRelease.objects.get(pk = to_release_id)
    except models.CubeRelease.DoesNotExist:
        return

    delta = to_release.cube - from_release.cube

    client = get_boto_client()

    with MultipartUpload(
        client,
        bucket = 'phdk',
        key = f'distributions/{delta.persistent_hash()}.pdf',
        acl = 'public-read',
    ) as uploader:
        with StreamProxyWriter(
            uploader,
            margin_size = .5,
            close_stream = False,
        ) as writer:
            for lap, multiplicity in delta.laps.items():
                writer.add_proxy(
                    ImageableProcessor.get_image(
                        ImageRequest(lap, size_slug = SizeSlug.ORIGINAL, save = False),
                        image_loader,
                    ),
                    multiplicity,
                )

    pdf_url = urljoin(SPACES_ENDPOINT, f'phdk/distributions/{delta.persistent_hash()}.pdf')

    models.LapChangePdf.objects.create(
        pdf_url = pdf_url,
        original_release_id = from_release_id,
        resulting_release_id = to_release_id,
    )

    async_to_sync(get_channel_layer().group_send)(
        f'pdf_delta_generate_{from_release_id}_{to_release_id}',
        {
            'type': 'delta_pdf_update',
            'pdf_url': pdf_url,
        },
    )


@shared_task()
def generate_cockatrice_images_bundle(release_id: int, prefer_latest_printing: bool = False):
    try:
        release: models.CubeRelease = models.CubeRelease.objects.get(pk = release_id)
    except models.CubeRelease.DoesNotExist:
        return

    if models.ReleaseImageBundle.objects.filter(
        release_id = release_id,
        target = models.ReleaseImageBundle.Target.COCKATRICE,
    ).exists():
        raise ValueError('Bundle already exists')

    client = get_boto_client()

    comparator = max if prefer_latest_printing else min

    with tempfile.TemporaryDirectory() as tmpdir:
        zip_file_name = os.path.join(tmpdir, 'bundle.zip')

        with zipfile.ZipFile(zip_file_name, "w") as f:
            cardboard_printing_map: t.MutableMapping[Cardboard, t.List[Printing]] = defaultdict(list)

            for printing in release.cube.all_printings:
                cardboard_printing_map[printing.cardboard].append(printing)

            for cardboard, printings in cardboard_printing_map.items():
                f.write(
                    ImageRequest(
                        comparator(
                            printings,
                            key = lambda p: p.expansion.release_date,
                        ),
                    ).path,
                    ''.join(card.name for card in cardboard.front_cards) + '.png',
                    zipfile.ZIP_STORED,
                )

        key = f'image_bundles/{release.cube.persistent_hash()}_{models.ReleaseImageBundle.Target.COCKATRICE.value}.zip'

        with MultipartUpload(
            client,
            bucket = 'phdk',
            key = key,
            acl = 'public-read',
        ) as uploader, open(zip_file_name, 'rb') as zip_file:
            while True:
                chunk = zip_file.read(1024 * 1024)
                if not chunk:
                    break
                uploader.write(chunk)

        models.ReleaseImageBundle.objects.create(
            release = release,
            url = urljoin(SPACES_ENDPOINT, 'phdk/' + key),
            target = models.ReleaseImageBundle.Target.COCKATRICE,
        )
