import typing as t

from hardcandy.schema import DeserializationError

from mtgorp.models.tournaments.matches import MatchType, FirstToN
from mtgorp.models.tournaments.tournaments import Tournament, AllMatches

from lobbies.games import options
from lobbies.games.options import T, OptionsValidationError, OptionedOption


class TournamentOptions(OptionedOption[t.Mapping[str, t.Any]]):
    tournament_type = options.OptionsOption(Tournament.tournaments_map.keys(), default = AllMatches.name)
    tournament_config = options.ConfigOption(default = AllMatches.options_schema.default)
    match_type = options.OptionsOption(MatchType.matches_map.keys(), default = FirstToN.name)
    match_config = options.ConfigOption(default = FirstToN.options_schema.default)

    def validate(self, value: t.Any) -> T:
        vs = super().validate(value)

        tournament_type = Tournament.tournaments_map[vs['tournament_type']]
        match_type = MatchType.matches_map[vs['match_type']]

        if not tournament_type.allow_match_draws and match_type.allows_draws:
            raise OptionsValidationError(
                'Match type incompatible with tournament type, tournament type does not allow draws'
            )

        try:
            vs['tournament_config'] = tournament_type.options_schema.deserialize_raw(vs['tournament_config'])
            vs['match_config'] = match_type.options_schema.deserialize_raw(vs['match_config'])
        except DeserializationError as e:
            raise OptionsValidationError(
                [_e.reason for _e in e.errors]
            )

        return vs

    @classmethod
    def deserialize_options(
        cls,
        tournament_options: t.Mapping[str, t.Any],
    ) -> t.Tuple[t.Type[Tournament], t.Mapping[str, t.Any], MatchType]:
        return (
            Tournament.tournaments_map[tournament_options['tournament_type']],
            tournament_options['tournament_config'],
            MatchType.matches_map[tournament_options['match_type']](**tournament_options['match_config'])
        )
