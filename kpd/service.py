import datetime
import typing as t
import uuid

import jwt
import requests
from django.conf import settings

from kpd import models
from kpd.settings import APPLICATION_UID, ASPSP_COUNTRY, ASPSP_NAME, CERT_PATH


API_ORIGIN = "https://api.tilisy.com"


def get_auth_headers() -> t.Mapping[str, str]:
    iat = int(datetime.datetime.now().timestamp())
    with open(CERT_PATH, "r") as f:
        return {
            "Authorization": "Bearer {}".format(
                jwt.encode(
                    {
                        "iss": "enablebanking.com",
                        "aud": "api.tilisy.com",
                        "iat": iat,
                        "exp": iat + 3600,
                    },
                    f.read(),
                    algorithm="RS256",
                    headers={"kid": APPLICATION_UID},
                )
            )
        }


def get_authentication_redirect() -> str:
    return requests.post(
        f"{API_ORIGIN}/auth",
        json={
            "access": {
                "valid_until": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=90)).isoformat()
            },
            "aspsp": {"name": ASPSP_NAME, "country": ASPSP_COUNTRY},
            "state": str(uuid.uuid4()),
            "redirect_url": f"{settings.HOST}/update-token",
            "psu_type": "personal",
        },
        headers=get_auth_headers(),
    ).json()["url"]


def create_session(auth_code: str) -> models.SessionKey:
    response = requests.post(
        f"{API_ORIGIN}/sessions",
        json={"code": auth_code},
        headers=get_auth_headers(),
    ).json()
    return models.SessionKey.objects.create(
        key=response["accounts"][0]["uid"],
        valid_until=datetime.datetime.fromisoformat(response["access"]["valid_until"]),
    )


def get_transactions(
    account_uid: str, from_timestamp: datetime.date, to_timestamp: datetime.date
) -> t.Sequence[t.Mapping[str, t.Any]]:
    query = {
        "date_from": from_timestamp.isoformat(),
        "date_to": to_timestamp.isoformat(),
    }
    continuation_key = None
    transactions = []
    headers = get_auth_headers()
    while True:
        if continuation_key:
            query["continuation_key"] = continuation_key
        response = requests.get(
            f"{API_ORIGIN}/accounts/{account_uid}/transactions",
            params=query,
            headers=headers,
        )
        response.raise_for_status()
        resp_data = response.json()
        transactions.extend(resp_data["transactions"])
        continuation_key = resp_data.get("continuation_key")
        if not continuation_key:
            break

    return transactions
