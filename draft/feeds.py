import datetime

from django.contrib.syndication.views import Feed

from draft.models import DraftSession


class CompetitiveDraftsFeed(Feed):

    def items(self):
        return DraftSession.objects.competitive_drafts().order_by('-started_at')[:10]

    def link(self) -> str:
        return '/drafts/'

    def item_link(self, item: DraftSession) -> str:
        return item.get_absolute_url()

    def item_title(self, item: DraftSession) -> str:
        return item.key

    def item_description(self, item: DraftSession) -> str:
        return ' vs. '.join(item.seats.values_list('user__username', flat = True).order_by('user__username'))

    def item_pubdate(self, item: DraftSession) -> datetime.datetime:
        return item.started_at
