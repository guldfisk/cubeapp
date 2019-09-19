import io

from boto3 import session
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from promise import Promise
from django.conf import settings

from proxypdf.write import ProxyWriter

from mtgorp.models.serilization.strategies.jsonid import JsonId

from mtgimg.interface import SizeSlug

from magiccube.collections.cube import Cube
from magiccube.collections.laps import TrapCollection

from api import models

from resources.staticdb import db
from resources.staticimageloader import image_loader


@shared_task()
def generate_release_lap_images(cube_release_id: int):
    try:
        release = models.CubeRelease.objects.get(pk = cube_release_id)
    except models.CubeRelease.DoesNotExist:
        return

    Promise.all(
        [
            image_loader.get_image(trap, size_slug = size_slug, save = True)
            for trap in
            JsonId(db).deserialize(
                Cube,
                release.cube_content,
            )
            for size_slug in
            SizeSlug
        ]
    ).get()


@shared_task()
def generate_distribution_pdf(patch_id: int, possibility_id: int, size_slug: SizeSlug = SizeSlug.MEDIUM):
    boto_session = session.Session()
    client = boto_session.client(
        's3',
        region_name = 'fra1',
        endpoint_url = 'https://phdk.fra1.digitaloceanspaces.com/',
        aws_access_key_id = settings.SPACES_PUBLIC_KEY,
        aws_secret_access_key = settings.SPACES_SECRET_KEY,
    )

    possibility = models.DistributionPossibility.objects.get(pk = possibility_id)

    trap_collection = JsonId(db).deserialize(
        TrapCollection,
        possibility.content,
    )

    f = io.BytesIO()

    proxy_writer = ProxyWriter(file = f)

    images = Promise.all(
        tuple(
            image_loader.get_image(
                lap,
                size_slug = size_slug,
                save = False,
            )
            for lap in
            trap_collection
        )
    ).get()

    for image in images:
        proxy_writer.add_proxy(image)

    proxy_writer.save()

    f.seek(0)

    client.put_object(
        Body = f,
        Bucket = 'phdk',
        Key = f'distributions/{trap_collection.persistent_hash()}.pdf',
        ACL = 'public-read',
    )

    f.close()

    pdf_url = f'https://phdk.fra1.digitaloceanspaces.com/phdk/distributions/{trap_collection.persistent_hash()}.pdf'

    possibility.pdf_url = pdf_url
    possibility.save()

    async_to_sync(get_channel_layer().group_send)(
        f'distributor_{patch_id}',
        {
            'type': 'distribution_pdf_update',
            'url': pdf_url,
            'possibility_id': possibility_id,
        },
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

    f = io.BytesIO()

    proxy_writer = ProxyWriter(file = f)

    images = Promise.all(
        tuple(
            image_loader.get_image(
                lap,
                size_slug = SizeSlug.ORIGINAL,
                save = False,
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

    f.close()

    models.LapChangePdf.objects.create(
        pdf_url = f'https://phdk.fra1.digitaloceanspaces.com/phdk/distributions/{delta.persistent_hash()}.pdf',
        original_release_id = from_release_id,
        resulting_release_id = to_release_id,
    )
    #
    # async_to_sync(get_channel_layer().group_send)(
    #     f'distributor_{patch_id}',
    #     {
    #         'type': 'distribution_pdf_update',
    #         'url': pdf_url,
    #         'possibility_id': possibility_id,
    #     },
    # )
