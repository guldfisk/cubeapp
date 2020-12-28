from django.conf import settings

from botocore.client import BaseClient
from boto3 import session


SPACES_REGION = 'fra1'
SPACES_ENDPOINT = 'https://phdk.fra1.digitaloceanspaces.com/'


def get_boto_client() -> BaseClient:
    return session.Session().client(
        's3',
        region_name = SPACES_REGION,
        endpoint_url = SPACES_ENDPOINT,
        aws_access_key_id = settings.SPACES_PUBLIC_KEY,
        aws_secret_access_key = settings.SPACES_SECRET_KEY,
    )
