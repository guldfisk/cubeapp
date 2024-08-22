import datetime

from django.contrib.syndication.views import Feed

from api.models import CubeRelease, VersionedCube


class ReleaseFeed(Feed):
    def get_object(self, request, *args, **kwargs):
        return VersionedCube.objects.get(id=kwargs["pk"])

    def items(self, obj: VersionedCube):
        return (
            CubeRelease.objects.filter(versioned_cube=obj)
            .select_related("versioned_cube")
            .order_by("-created_at")[:10]
        )

    def title(self, obj: VersionedCube) -> str:
        return obj.name

    def link(self, obj: VersionedCube) -> str:
        return obj.get_absolute_url()

    def description(self, obj: VersionedCube) -> str:
        return obj.description

    def item_title(self, item: CubeRelease) -> str:
        return item.name

    def item_description(self, item: CubeRelease) -> str:
        return item.versioned_cube.description

    def item_pubdate(self, item: CubeRelease) -> datetime.datetime:
        return item.created_at
