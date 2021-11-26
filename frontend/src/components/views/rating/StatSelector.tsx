import React from "react";
import Select, {MultiValue} from "react-select";

import {Option} from "../../utils/MultiSelect";


const options = [
  {value: 'ci_deck_conversion_rate', label: 'Ci Deck Conversion Rate'},
  {value: 'ci_maindeck_conversion_rate', label: 'Ci Maindeck Conversion Rate'},
  {value: 'ci_maindeck_win_rate', label: 'Ci Maindeck Win Rate'},
  {value: 'ci_sideboard_conversion_rates', label: 'Ci Sideboard Conversion Rates'},
  {value: 'ci_sideboard_win_rate', label: 'Ci Sideboard Win Rate'},
  {value: 'ci_win_rate', label: 'Ci Win Rate'},
  {value: 'deck_conversion_rate', label: 'Deck Conversion Rate'},
  {value: 'deck_occurrences', label: 'Deck Occurrences'},
  {value: 'maindeck_conversion_rate', label: 'Maindeck Conversion Rate'},
  {value: 'maindeck_matches', label: 'Maindeck Matches'},
  {value: 'maindeck_occurrences', label: 'Maindeck Occurrences'},
  {value: 'maindeck_win_rate', label: 'Maindeck Win Rate'},
  {value: 'maindeck_wins', label: 'Maindeck Wins'},
  {value: 'matches', label: 'Matches'},
  {value: 'pool_occurrences', label: 'Pool Occurrences'},
  {value: 'sideboard_conversion_rate', label: 'Sideboard Conversion Rate'},
  {value: 'sideboard_matches', label: 'Sideboard Matches'},
  {value: 'sideboard_occurrences', label: 'Sideboard Occurrences'},
  {value: 'sideboard_win_rate', label: 'Sideboard Win Rate'},
  {value: 'sideboard_wins', label: 'Sideboard Wins'},
  {value: 'weighted_deck_occurrences', label: 'Weighted Deck Occurrences'},
  {value: 'weighted_maindeck_matches', label: 'Weighted Maindeck Matches'},
  {value: 'weighted_maindeck_occurrences', label: 'Weighted Maindeck Occurrences'},
  {value: 'weighted_maindeck_wins', label: 'Weighted Maindeck Wins'},
  {value: 'weighted_matches', label: 'Weighted Matches'},
  {value: 'weighted_pool_occurrences', label: 'Weighted Pool Occurrences'},
  {value: 'weighted_sideboard_matches', label: 'Weighted Sideboard Matches'},
  {value: 'weighted_sideboard_occurrences', label: 'Weighted Sideboard Occurrences'},
  {value: 'weighted_sideboard_wins', label: 'Weighted Sideboard Wins'},
  {value: 'weighted_wins', label: 'Weighted Wins'},
  {value: 'win_rate', label: 'Win Rate'},
  {value: 'wins', label: 'Wins'},
]

interface StatSelectorProps {
  value: MultiValue<{ label: string, value: string }>
  onChange: (selected: MultiValue<{ value: string, label: string }>) => void
}


export const StatSelector: React.FunctionComponent<StatSelectorProps> = (props: StatSelectorProps) => {
  return <Select
    options={options}
    isMulti
    closeMenuOnSelect={false}
    hideSelectedOptions={false}
    components={{Option}}
    onChange={props.onChange}
    value={props.value}
  />
}