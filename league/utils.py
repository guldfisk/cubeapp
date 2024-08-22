from django.contrib.auth import get_user_model
from django.db.models import Prefetch, QuerySet

from limited.models import PoolDeck


USER_QUERY_SET = get_user_model().objects.all().only("id", "username")


def prefetch_league_tournament_related(qs: QuerySet) -> QuerySet:
    return qs.prefetch_related(
        "tournament__participants",
        Prefetch(
            "tournament__participants__deck",
            queryset=PoolDeck.objects.all().only(
                "id",
                "name",
                "created_at",
                "pool_id",
            ),
        ),
        Prefetch(
            "tournament__participants__player",
            queryset=USER_QUERY_SET,
        ),
        "tournament__participants__deck__pool",
        Prefetch(
            "tournament__participants__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
        "tournament__rounds",
        "tournament__rounds__matches",
        "tournament__rounds__matches__seats",
        "tournament__rounds__matches__seats__participant",
        Prefetch(
            "tournament__rounds__matches__seats__participant__player",
            queryset=USER_QUERY_SET,
        ),
        Prefetch(
            "tournament__rounds__matches__seats__participant__deck",
            queryset=PoolDeck.objects.all().only(
                "id",
                "name",
                "created_at",
                "pool_id",
            ),
        ),
        Prefetch(
            "tournament__rounds__matches__seats__participant__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
        "tournament__rounds__matches__seats__result",
        "tournament__rounds__matches__result",
        "tournament__results",
        "tournament__results__participant",
        Prefetch(
            "tournament__results__participant__player",
            queryset=USER_QUERY_SET,
        ),
        "tournament__results__participant__deck",
        "tournament__results__participant__deck__pool",
        Prefetch(
            "tournament__results__participant__deck__pool__user",
            queryset=USER_QUERY_SET,
        ),
    )
