import datetime
import functools
import itertools
import os
import subprocess
import tempfile
import typing as t
import zipfile
from collections import defaultdict
from contextlib import ExitStack
from urllib.parse import urljoin

from botocore.client import BaseClient
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer

from django.template.loader import get_template

from proxypdf.streamwriter import StreamProxyWriter

from mtgorp.managejson.update import MTG_JSON_DATETIME_FORMAT, get_last_db_update, check_and_update, get_update_db
from mtgorp.models.persistent.attributes.expansiontype import ExpansionType
from mtgorp.models.persistent.cardboard import Cardboard
from mtgorp.models.persistent.printing import Printing

from mtgimg.interface import SizeSlug, ImageRequest
from mtgimg.pipeline import ImageableProcessor, get_pipeline

from magiccube.collections.laps import TrapCollection

from api import models
from api.boto import get_boto_client, SPACES_ENDPOINT
from api.mail import mail_me
from cubeapp import settings
from resources.staticimageloader import image_loader
from utils.boto import MultipartUpload


def inject_boto_client(f: t.Callable) -> t.Callable:
    @functools.wraps(f)
    def wrapper(*args, **kwargs) -> t.Any:
        kwargs['client'] = get_boto_client()
        return f(*args, **kwargs)

    return wrapper


@shared_task()
def check_mtg_json():
    update_db = get_update_db()
    updated, dbs = check_and_update(update_db = update_db)
    if not updated:
        return

    last_set_with_printings = max(
        filter(
            lambda e: (
                e.expansion_type == ExpansionType.SET
                and e.printings
            ),
            dbs[0].expansions.values(),
        ),
        key = lambda e: e.release_date,
    )

    if last_set_with_printings.code != models.ExpansionUpdate.objects.order_by(
        'created_at',
    ).values_list('expansion_code', flat = True).last():
        models.ExpansionUpdate.objects.create(expansion_code = last_set_with_printings.code)
        mail_me(
            f'new mtg set in db [{last_set_with_printings.code}]',
            get_template('db_updated_mail.html').render(
                {
                    'mtgjson_timestamp': get_last_db_update(update_db = update_db).strftime(MTG_JSON_DATETIME_FORMAT),
                    'expansion': last_set_with_printings,
                }
            ),
        )


@shared_task()
def generate_release_images(cube_release_id: int):
    release = models.CubeRelease.objects.get(pk = cube_release_id)

    for cubeable, size_slug in itertools.product(
        set(
            itertools.chain(
                release.cube.cubeables.distinct_elements(),
                release.cube.all_printings,
            )
        ),
        SizeSlug,
    ):
        image_request = ImageRequest(cubeable, size_slug = size_slug, cache_only = True)
        get_pipeline(image_request).get_image(image_request, image_loader)


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


@shared_task()
def backup_db():
    with MultipartUpload(
        client = get_boto_client(),
        bucket = 'phdk',
        key = f'db-backups/{datetime.datetime.now().strftime("%Y-%m-%d-%H-%M-%S")}.dmp',
    ) as out_file:
        s = subprocess.Popen(
            [
                'pg_dump',
                '--dbname=postgresql://{}:{}@{}:{}/{}'.format(
                    settings.DATABASE_USER,
                    settings.DATABASE_PASSWORD,
                    settings.DATABASE_HOST,
                    settings.DATABASE_PORT,
                    settings.DATABASE_NAME,
                ),
                '-Fc',
            ],
            stdout = subprocess.PIPE,
            stderr = subprocess.PIPE,
        )
        while True:
            chunk = s.stdout.read(1024)
            if not chunk and s.poll() is not None:
                break
            out_file.write(chunk)

        if s.poll() != 0:
            try:
                error_message = s.stderr.read().decode('utf8')
            except Exception as e:
                error_message = str(e)
            mail_me('DB backup failed :(', 'error: ' + error_message, force = True)
            raise Exception('pg_dump failed')
