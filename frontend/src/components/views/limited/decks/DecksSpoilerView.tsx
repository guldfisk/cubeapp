import React from 'react';
import {FullDeck} from "../../../models/models";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import DeckView from "./DeckView";


interface DecksSpoilerViewProps {
  decks: FullDeck[];
}


export default class DecksSpoilerView extends React.Component<DecksSpoilerViewProps> {

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
              record={deck.record}
            />
          </Row>
        )
      }
    </Container>
  }

}