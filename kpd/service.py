import datetime
import typing as t

import jwt
import requests

from kpd.settings import ACCOUNT_UID, CERT_PATH, APPLICATION_UID


API_ORIGIN = 'https://api.tilisy.com'


def get_auth_headers() -> t.Mapping[str, str]:
    iat = int(datetime.datetime.now().timestamp())
    with open(CERT_PATH, 'r') as f:
        return {
            'Authorization': 'Bearer {}'.format(
                jwt.encode(
                    {
                        'iss': 'enablebanking.com',
                        'aud': 'api.tilisy.com',
                        'iat': iat,
                        'exp': iat + 3600,
                    },
                    f.read(),
                    algorithm = 'RS256',
                    headers = {'kid': APPLICATION_UID},
                )
            )
        }


def get_transactions(from_timestamp: datetime.date, to_timestamp: datetime.date) -> t.Sequence[t.Mapping[str, t.Any]]:
    query = {
        'date_from': from_timestamp.isoformat(),
        'date_to': to_timestamp.isoformat(),
    }
    continuation_key = None
    transactions = []
    headers = get_auth_headers()
    while True:
        if continuation_key:
            query['continuation_key'] = continuation_key
        response = requests.get(
            f'{API_ORIGIN}/accounts/{ACCOUNT_UID}/transactions',
            params = query,
            headers = headers,
        )
        response.raise_for_status()
        resp_data = response.json()
        transactions.extend(resp_data['transactions'])
        continuation_key = resp_data.get('continuation_key')
        if not continuation_key:
            break

    return transactions
