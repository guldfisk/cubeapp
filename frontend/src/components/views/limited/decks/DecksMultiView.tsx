import React from "react";

import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";

import DecksSpoilerView from "./DecksSpoilerView";
import {FullDeck} from "../../../models/models";
import DecksTableView from "./DecksTableView";


interface DecksMultiViewProps {
  decks: FullDeck[];

}


interface DecksMultiViewState {
  viewType: string
}


export default class DecksMultiView extends React.Component<DecksMultiViewProps, DecksMultiViewState> {

  constructor(props: null) {
    super(props);
    this.state = {
      viewType: 'spoiler',
    };
  }


  render() {
    return <Container fluid>
      <Row>
        <select
          className="ml-auto"
          onChange={
            event => this.setState({viewType: event.target.value})
          }
          value={this.state.viewType}
        >
          <option value="spoiler">Spoiler</option>
          <option value="table">Table</option>
        </select>
      </Row>
      <Row>
        {
          this.state.viewType == 'spoiler' ?
            <DecksSpoilerView
              decks={this.props.decks}
            /> :
            <DecksTableView decks={this.props.decks}/>
        }

      </Row>
    </Container>
  }

}