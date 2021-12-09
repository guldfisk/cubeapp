import React from 'react';
import DeckSearchView from "../../views/limited/decks/DeckSearchView";


interface DecksPageProps {
  location: any
}

interface DecksPageState {

}


export default class DecksPage extends React.Component<DecksPageProps, DecksPageState> {

  render() {
    return <DeckSearchView location={this.props.location}/>
  }

}
