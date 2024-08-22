import datetime

from django.contrib.syndication.views import Feed

from league.models import HOFLeague, Season


class SeasonsFeed(Feed):
    def get_object(self, request, *args, **kwargs):
        return HOFLeague.objects.get(id=kwargs["pk"])

    def items(self, obj: HOFLeague):
        return (
            Season.objects.filter(
                league=obj,
            )
            .select_related(
                "league",
            )
            .prefetch_related(
                "tournament",
            )
            .order_by(
                "-created_at",
            )[:10]
        )

    def title(self, obj: HOFLeague) -> str:
        return obj.name

    def link(self, obj: HOFLeague) -> str:
        return obj.get_absolute_url()

    def description(self, obj: HOFLeague) -> str:
        return f"HOF League for {obj.versioned_cube.name}"

    def item_title(self, item: Season) -> str:
        return item.tournament.name

    def item_description(self, item: Season) -> str:
        return item.tournament.state.name.lower()

    def item_pubdate(self, item: Season) -> datetime.datetime:
        return item.created_at
