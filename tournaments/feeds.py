import datetime

from django.contrib.syndication.views import Feed

from tournaments.models import Tournament


class TournamentFeed(Feed):

    def items(self):
        return Tournament.objects.order_by('-created_at').prefetch_related(
            'participants__player',
            'participants__deck',
        )[:10]

    def link(self) -> str:
        return '/tournaments/'

    def title(self) -> str:
        return 'Tournaments'

    def item_link(self, item: Tournament) -> str:
        return item.get_absolute_url()

    def item_title(self, item: Tournament) -> str:
        return item.name

    def item_description(self, item: Tournament) -> str:
        return ' vs. '.join(sorted(p.player.username if p.player is not None else p.deck.name for p in item.participants.all()))

    def item_pubdate(self, item: Tournament) -> datetime.datetime:
        return item.created_at
