import React from 'react';
import DeckSearchView from "../../views/limited/decks/DeckSearchView";


interface DecksPageProps {
}

interface DecksPageState {

}


export default class DecksPage extends React.Component<DecksPageProps, DecksPageState> {

  // constructor(props: SessionsPageProps) {
  //   super(props);
  //   this.state = {
  //     page: 1,
  //     pageSize: 20,
  //     sessions: [],
  //     hits: 0,
  //     filters: {},
  //     sortField: 'created_at',
  //     sortAscending: false,
  //     deleting: null,
  //   };
  // }


  render() {


    return <>
      <DeckSearchView/>
    </>
  }

}
