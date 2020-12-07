from django.contrib.auth import get_user_model
from django.db import models

from utils.mixins import TimestampedModel


# class Tournament(TimestampedModel):
#     tournament_type = models.CharField(max_length = 255)
#     match_type = models.CharField(max_length = 255)
#
#
# class TournamentRound(TimestampedModel):
#     tournament = models.ForeignKey(Tournament, on_delete = models.CASCADE)
#
#
# class TournamentMatch(TimestampedModel):
#     draws = models.IntegerField()
#     round = models.ForeignKey(TournamentRound, on_delete = models.CASCADE)
#
#
# class TournamentMatchSeat(TimestampedModel):
#     player = models.ForeignKey(get_user_model(), on_delete = models.PROTECT)
#     wins = models.PositiveSmallIntegerField()
#     match = models.ForeignKey(TournamentMatch, on_delete = models.CASCADE)
#
#
# class TournamentResult(TimestampedModel):
#     tournament = models.ForeignKey(Tournament, on_delete = models.CASCADE)
#
#
# class TournamentWin(TimestampedModel):
#     result = models.ForeignKey(TournamentResult, on_delete = models.CASCADE)
