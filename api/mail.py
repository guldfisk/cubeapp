import typing as t

import requests

from cubeapp import settings


def send_mail(
    subject: str,
    content: str,
    recipients: t.List[str],
):
    return requests.post(
        "https://api.eu.mailgun.net/v3/{}/messages".format(
            settings.MAILGUN_DOMAIN
        ),
        auth=("api", settings.MAILGUN_KEY),
        data={
            "from": "mail@{}".format(settings.MAILGUN_DOMAIN),
            "to": recipients,
            "subject": subject,
            "html": content,
        },
    )

