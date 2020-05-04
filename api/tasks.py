import os
import typing as t

import tempfile
import itertools
import zipfile

from collections import defaultdict

from boto3 import session
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from mtgorp.models.persistent.printing import Printing

from mtgorp.models.persistent.cardboard import Cardboard
from promise import Promise
from django.conf import settings

from proxypdf.write import ProxyWriter

from mtgorp.db.create import update_database
from mtgorp.managejson.update import check_and_update

from mtgimg.interface import SizeSlug, ImageRequest

from magiccube.collections.laps import TrapCollection

from api import models
from api.mail import mail_me

from resources.staticimageloader import image_loader


@shared_task()
def check_mtg_json():
    if check_and_update():
        update_database()
        mail_me(
            'new mtgjson',
            'lmao',
        )


@shared_task()
def generate_release_lap_images(cube_release_id: int):
    try:
        release = models.CubeRelease.objects.get(pk = cube_release_id)
    except models.CubeRelease.DoesNotExist:
        return

    Promise.all(
        [
            image_loader.get_image(lap, cache_only = True, size_slug = size_slug)
            for lap, size_slug in
            itertools.product(release.cube.laps, SizeSlug)
        ]
    ).get()


@shared_task()
def generate_distribution_pdf(
    patch_id: int,
    possibility_id: int,
    size_slug: SizeSlug = SizeSlug.MEDIUM,
    include_changes_pdf: bool = False,
):
    boto_session = session.Session()
    client = boto_session.client(
        's3',
        region_name = 'fra1',
        endpoint_url = 'https://phdk.fra1.digitaloceanspaces.com/',
        aws_access_key_id = settings.SPACES_PUBLIC_KEY,
        aws_secret_access_key = settings.SPACES_SECRET_KEY,
    )

    possibility = models.DistributionPossibility.objects.get(pk = possibility_id)

    cube_traps = TrapCollection(possibility.release.cube.garbage_traps)

    unique_traps = frozenset(possibility.trap_collection) | frozenset(cube_traps)

    def _helper(trap):
        def _wrapped(img):
            return trap, img

        return _wrapped

    images = dict(
        Promise.all(
            tuple(
                image_loader.get_image(
                    trap,
                    size_slug = size_slug,
                    save = False,
                ).then(
                    _helper(trap)
                )
                for trap in
                unique_traps
            )
        ).get()
    )

    pdfs = (
        ('all', possibility.trap_collection, 'pdf_url'),
    )

    if include_changes_pdf:
        pdfs += (
            ('added', possibility.trap_collection - cube_traps, 'added_pdf_url'),
            ('removed', cube_traps - possibility.trap_collection, 'removed_pdf_url'),
        )

    urls = {}

    for name, traps, url_attribute_name in pdfs:
        with tempfile.TemporaryFile() as f:
            proxy_writer = ProxyWriter(file = f)

            for trap in traps:
                proxy_writer.add_proxy(images[trap])

            proxy_writer.save()

            f.seek(0)

            storage_key = f'distributions/{possibility.trap_collection.persistent_hash()}_{name}.pdf'

            client.put_object(
                Body = f,
                Bucket = 'phdk',
                Key = storage_key,
                ACL = 'public-read',
            )

            pdf_url = 'https://phdk.fra1.digitaloceanspaces.com/phdk/' + storage_key

            urls[url_attribute_name] = pdf_url

            setattr(
                possibility,
                url_attribute_name,
                pdf_url
            )

    possibility.save()

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

    boto_session = session.Session()
    client = boto_session.client(
        's3',
        region_name = 'fra1',
        endpoint_url = 'https://phdk.fra1.digitaloceanspaces.com/',
        aws_access_key_id = settings.SPACES_PUBLIC_KEY,
        aws_secret_access_key = settings.SPACES_SECRET_KEY,
    )

    with tempfile.TemporaryFile() as f:
        proxy_writer = ProxyWriter(file = f, margin_size = .5)

        images = Promise.all(
            tuple(
                image_loader.get_image(
                    lap,
                    size_slug = SizeSlug.ORIGINAL,
                )
                for lap in
                delta.laps
            )
        ).get()

        for image in images:
            proxy_writer.add_proxy(image)

        proxy_writer.save()

        f.seek(0)

        client.put_object(
            Body = f,
            Bucket = 'phdk',
            Key = f'distributions/{delta.persistent_hash()}.pdf',
            ACL = 'public-read',
        )

    pdf_url = f'https://phdk.fra1.digitaloceanspaces.com/phdk/distributions/{delta.persistent_hash()}.pdf'

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

    boto_session = session.Session()
    client = boto_session.client(
        's3',
        region_name = 'fra1',
        endpoint_url = 'https://phdk.fra1.digitaloceanspaces.com/',
        aws_access_key_id = settings.SPACES_PUBLIC_KEY,
        aws_secret_access_key = settings.SPACES_SECRET_KEY,
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        zip_file_name = os.path.join(tmpdir, 'bundle.zip')
        with zipfile.ZipFile(zip_file_name, "w") as f:
            cardboard_printing_map: t.MutableMapping[Cardboard, t.List[Printing]] = defaultdict(list)
            for printing in release.cube.all_printings:
                cardboard_printing_map[printing.cardboard].append(printing)
            for cardboard, printings in cardboard_printing_map.items():
                f.write(
                    ImageRequest(
                        (max if prefer_latest_printing else min)(
                            printings,
                            key = lambda p: p.expansion.release_date,
                        ),
                    ).path,
                    ''.join(card.name for card in cardboard.front_cards) + '.png',
                    zipfile.ZIP_STORED,
                )

        key = f'image_bundles/{release.cube.persistent_hash()}_{models.ReleaseImageBundle.Target.COCKATRICE.value}.zip'

        client.upload_file(
            Filename = zip_file_name,
            Bucket = 'phdk',
            Key = key,
            ExtraArgs = {
                'ACL': 'public-read',
            },
        )
        models.ReleaseImageBundle.objects.create(
            release = release,
            url = f'https://phdk.fra1.digitaloceanspaces.com/phdk/{key}',
            target = models.ReleaseImageBundle.Target.COCKATRICE,
        )
