import logging

from django.core.management.base import BaseCommand

from api.models import RelatedPrinting
from limited.models import PoolDeck


class Command(BaseCommand):
    help = 'Create related printing objects for decks.'

    def handle(self, *args, **options):
        logging.basicConfig(format = '%(levelname)s %(message)s', level = logging.INFO)

        related_printings = []

        for deck in PoolDeck.objects.all():
            for printing in deck.deck.seventy_five.distinct_elements():
                related_printings.append(RelatedPrinting(related = deck, printing_id = printing.id))

        RelatedPrinting.objects.bulk_create(related_printings)
