import React from "react";

import DecksSpoilerView from "./DecksSpoilerView";
import {FullDeck} from "../../../models/models";


interface RecentDecksViewState {
  decks: FullDeck[];
}


interface RecentDecksViewProps {
  amount: number
}


export default class RecentDecksView extends React.Component<RecentDecksViewProps, RecentDecksViewState> {

  public static defaultProps = {
    amount: 10
  };

  constructor(props: RecentDecksViewProps) {
    super(props);
    this.state = {
      decks: [],
    }
  }

  componentDidMount() {
    FullDeck.recent(
      0,
      this.props.amount,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            decks: objects,
          }
        )
      }
    );
  }

  render() {
    return <DecksSpoilerView
      decks={this.state.decks}
    />
  }

}