import typing as t

from rest_framework.fields import SerializerMethodField

from api.serialization import orpserialize
from api.serialization.serializers import OrpSerializerField
from limited import models
from limited.serializers.limitedsessions import LimitedSessionNameSerializer
from limited.serializers.pooldecks.minimal import MinimalPoolDeckSerializer
from tournaments.models import ScheduledMatch, SeatResult, Tournament


class PoolDeckSerializer(MinimalPoolDeckSerializer):
    deck = OrpSerializerField(model_serializer=orpserialize.DeckSerializer)

    class Meta:
        model = models.PoolDeck
        fields = ("id", "name", "created_at", "deck", "pool_id", "user")


class FullPoolDeckSerializer(PoolDeckSerializer):
    limited_session = LimitedSessionNameSerializer(source="pool.session")
    record = SerializerMethodField()

    class Meta:
        model = models.PoolDeck
        fields = ("id", "name", "created_at", "deck", "user", "limited_session", "pool_id", "record")

    @classmethod
    def get_record(cls, instance: models.PoolDeck) -> t.Mapping[str, t.Any]:
        if hasattr(instance, "win_record") and hasattr(instance, "loss_record") and hasattr(instance, "draw_record"):
            return {"wins": instance.win_record, "losses": instance.loss_record, "draws": instance.draw_record}

        try:
            tournament = instance.pool.session.tournament
        except Tournament.DoesNotExist:
            return {"wins": 0, "losses": 0, "draws": 0}

        wins, losses, draws = 0, 0, 0

        for match in ScheduledMatch.objects.filter(
            round__tournament=tournament,
            seats__participant__deck_id=instance.id,
        ).prefetch_related(
            "seats__participant",
            "seats__result",
        ):
            try:
                wins_map = {seat.participant.deck_id: seat.result.wins for seat in match.seats.all()}
            except SeatResult.DoesNotExist:
                continue

            max_wins = max(wins_map.values())
            winners = [k for k, v in wins_map.items() if v == max_wins]
            if not winners:
                continue
            if len(winners) > 1 and instance.id in winners:
                draws += 1
            elif len(winners) == 1 and winners[0] == instance.id:
                wins += 1
            else:
                losses += 1

        return {"wins": wins, "losses": losses, "draws": draws}
