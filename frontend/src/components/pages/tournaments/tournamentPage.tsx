import React from 'react';

import {FullDeck, Tournament} from '../../models/models';
import {Loading} from "../../utils/utils";
import TournamentView from "../../views/tournaments/TournamentView";
import DeckView from "../../views/limited/decks/DeckView";


interface TournamentPageProps {
  match: any
}

interface TournamentPageState {
  tournament: Tournament | null;
  decks: FullDeck[];
}


export default class TournamentPage extends React.Component<TournamentPageProps, TournamentPageState> {

  constructor(props: TournamentPageProps) {
    super(props);
    this.state = {
      tournament: null,
      decks: [],
    };
  }

  componentDidMount() {
    this.refresh();
  }

  refresh = (): void => {
    Tournament.get(this.props.match.params.id).then(
      tournament => {
        this.setState(
          {tournament, decks: []},
          () => {
            this.state.tournament.participants.forEach(
              (participant) => FullDeck.get(participant.deck.id).then(
                deck => this.setState({decks: this.state.decks.concat([deck])})
              )
            )
          }
        );
      }
    );
  };

  render() {
    let tournamentView = <Loading/>;
    if (this.state.tournament !== null) {
      tournamentView = <TournamentView
        tournament={this.state.tournament}
        handleCanceled={this.refresh}
        handleMatchSubmitted={this.refresh}
      />
    }
    return <>
      {tournamentView}
      {
        this.state.decks.map(
          deck => <DeckView
            key={deck.id}
            deck={deck}
            user={deck.user}
            limitedSession={deck.limitedSession}
            record={deck.record}
          />
        )
      }
    </>;
  }

}
