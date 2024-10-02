import typing as t

import requests
from django.conf import settings


def send_mail(
    subject: str,
    content: str,
    recipients: t.List[str],
    blind: bool = None,
    attachments: t.Sequence[t.Tuple[str, str]] = (),
):
    if blind == None:
        blind = len(recipients) > 1
    return requests.post(
        "https://api.eu.mailgun.net/v3/{}/messages".format(settings.MAILGUN_DOMAIN),
        auth=("api", settings.MAILGUN_KEY),
        data={
            "from": "mail@{}".format(settings.MAILGUN_DOMAIN),
            "to": "mail@{}".format(settings.MAILGUN_DOMAIN) if blind else recipients,
            "bcc": recipients * blind,
            "subject": subject,
            "html": content,
        },
        files=[("attachment", attachment) for attachment in attachments],
    )


def mail_me(
    subject: str,
    content: str,
    attachments: t.Sequence[t.Tuple[str, str]] = (),
    force: bool = False,
):
    if settings.DEBUG and not force:
        return
    return send_mail(subject, content, [settings.OWNER_EMAIL], attachments=attachments)
