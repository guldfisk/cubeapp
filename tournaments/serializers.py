from rest_framework import serializers
from rest_framework.fields import SerializerMethodField

from mtgorp.models.tournaments import tournaments as to

from api.serialization.serializers import UserSerializer
from limited.serializers.pooldecks.minimal import MinimalPoolDeckSerializer
from tournaments import models
from utils.serialization.fields import EnumSerializerField, LambdaSerializer


class DumbSerializer(serializers.Serializer):

    def update(self, instance, validated_data):
        raise NotImplemented()

    def create(self, validated_data):
        raise NotImplemented()


class SeatResultSubmitSerializer(DumbSerializer):
    seat = serializers.IntegerField()
    wins = serializers.IntegerField()


class ResultSubmitSerializer(DumbSerializer):
    draws = serializers.IntegerField()
    seat_results = SeatResultSubmitSerializer(many = True)

    @property
    def as_completed_match(self) -> to.CompletedMatch[int]:
        return to.CompletedMatch(
            draws = self.validated_data['draws'],
            results = {
                result['seat']: result['wins']
                for result in
                self.validated_data['seat_results']
            },
        )


class SeatResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SeatResult
        fields = ('id', 'wins')


class MatchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MatchResult
        fields = ('id', 'draws')


class ParticipantSerializer(serializers.ModelSerializer):
    player = UserSerializer(read_only = True)
    deck = MinimalPoolDeckSerializer()

    class Meta:
        model = models.TournamentParticipant
        fields = ('id', 'player', 'seed', 'deck')


class ScheduledSeatSerializer(serializers.ModelSerializer):
    participant = ParticipantSerializer()
    result = SeatResultSerializer()

    class Meta:
        model = models.ScheduledSeat
        fields = ('id', 'participant', 'result')


class ScheduledMatchSerializer(serializers.ModelSerializer):
    seats = ScheduledSeatSerializer(many = True)
    result = MatchResultSerializer()

    class Meta:
        model = models.ScheduledMatch
        fields = ('id', 'seats', 'result')


class RoundSerializer(serializers.ModelSerializer):
    matches = ScheduledMatchSerializer(many = True)

    class Meta:
        model = models.TournamentRound
        fields = ('id', 'index', 'matches')


class TournamentWinnerSerializer(serializers.ModelSerializer):
    participant = ParticipantSerializer()

    class Meta:
        model = models.TournamentWinner
        fields = ('id', 'participant')


class MinimalTournamentSerializer(serializers.ModelSerializer):
    state = EnumSerializerField(models.Tournament.TournamentState)
    tournament_type = LambdaSerializer(lambda tt: tt.name)
    match_type = LambdaSerializer(lambda mt: mt.serialize())
    participants = ParticipantSerializer(many = True)
    round_amount = SerializerMethodField()
    results = TournamentWinnerSerializer(many = True)

    class Meta:
        model = models.Tournament
        fields = (
            'id', 'state', 'name', 'tournament_type', 'tournament_config', 'match_type', 'participants',
            'created_at', 'results', 'finished_at', 'round_amount',
        )

    @classmethod
    def get_round_amount(cls, tournament: models.Tournament) -> int:
        return tournament.tournament.round_amount


class TournamentSerializer(MinimalTournamentSerializer):
    rounds = RoundSerializer(many = True)

    class Meta:
        model = models.Tournament
        fields = (
            'id', 'state', 'name', 'tournament_type', 'tournament_config', 'match_type', 'participants', 'rounds',
            'created_at', 'results', 'finished_at', 'round_amount',
        )


class FullScheduledMatchSerializer(ScheduledMatchSerializer):
    tournament = MinimalTournamentSerializer(source = 'round.tournament')
    round = serializers.IntegerField(source = 'round.index')

    class Meta:
        model = models.ScheduledMatch
        fields = ('id', 'seats', 'result', 'tournament', 'round')
