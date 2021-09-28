import typing as t

from django.conf import settings

from botocore.client import BaseClient
from boto3 import session


SPACES_REGION = 'fra1'
SPACES_ENDPOINT = 'https://fra1.digitaloceanspaces.com/'


def get_boto_client() -> BaseClient:
    return session.Session().client(
        's3',
        region_name = SPACES_REGION,
        endpoint_url = SPACES_ENDPOINT,
        aws_access_key_id = settings.SPACES_PUBLIC_KEY,
        aws_secret_access_key = settings.SPACES_SECRET_KEY,
    )


def get_last_key(client: BaseClient, prefix: str) -> t.Optional[str]:
    r = client.list_objects(Bucket = 'phdk', Prefix = prefix)
    if 'Contents' not in r:
        return None
    return max(
        r['Contents'],
        key = lambda i: i['LastModified'],
    )['Key']
