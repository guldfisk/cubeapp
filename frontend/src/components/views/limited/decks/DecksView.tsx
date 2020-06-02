import React from 'react';
import {FullDeck} from "../../../models/models";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import DeckView from "./DeckView";


interface DecksViewProps {
  decks: FullDeck[];
}


export default class DecksView extends React.Component<DecksViewProps> {

  render() {
    return <Container
      fluid
    >
      {
        this.props.decks.map(
          deck => <Row>
            <DeckView
              deck={deck}
              user={deck.user}
              limitedSession={deck.limitedSession}
            />
          </Row>
        )
      }
    </Container>
  }

}