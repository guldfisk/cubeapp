import React from 'react';

import {FullDeck, ScheduledMatch} from '../../models/models';
import {Loading} from "../../utils/utils";
import DeckView from "../../views/limited/decks/DeckView";
import MatchView from "../../views/tournaments/MatchView";


interface MatchPageProps {
  match: any
}

interface MatchPageState {
  scheduledMatch: ScheduledMatch | null;
  decks: FullDeck[];
}


export default class MatchPage extends React.Component<MatchPageProps, MatchPageState> {

  constructor(props: MatchPageProps) {
    super(props);
    this.state = {
      scheduledMatch: null,
      decks: [],
    };
  }

  componentDidMount() {
    this.refresh();
  }

  refresh = (): void => {
    ScheduledMatch.get(this.props.match.params.id).then(
      scheduledMatch => {
        this.setState(
          {scheduledMatch, decks: []},
          () => {
            this.state.scheduledMatch.seats.forEach(
              (seat) => FullDeck.get(seat.participant.deck.id).then(
                deck => this.setState({decks: this.state.decks.concat([deck])})
              )
            )
          }
        );
      }
    );
  };

  render() {
    let matchView = <Loading/>;
    if (this.state.scheduledMatch !== null) {
      matchView = <MatchView match={this.state.scheduledMatch}/>
    }
    return <>
      {matchView}
      {
        this.state.decks.map(
          deck => <DeckView
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
