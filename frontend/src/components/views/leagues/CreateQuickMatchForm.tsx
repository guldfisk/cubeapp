import React from "react";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import {Deck, League} from "../../models/models";


interface CreateQuickMatchFormProps {
  leagueId: string | number
  handleSubmit: (rated: boolean, deckIds: (string | number)[]) => void
}

interface CreateQuickMatchFormState {
  rated: boolean
  firstDeckId: string | number | null
  secondDeckId: string | number | null
  availableDecks: Deck[]
}


export default class CreateQuickMatchForm extends React.Component<CreateQuickMatchFormProps, CreateQuickMatchFormState> {

  constructor(props: CreateQuickMatchFormProps) {
    super(props);
    this.state = {
      rated: false,
      firstDeckId: null,
      secondDeckId: null,
      availableDecks: [],
    }
  }

  componentDidMount() {
    League.eligibleDecks(this.props.leagueId, 0, 1000).then(
      (response) => this.setState({availableDecks: response.objects})
    )
  }

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      this.state.rated,
      [this.state.firstDeckId, this.state.secondDeckId].filter(v => v),
    );
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Group controlId="rated">
        <Form.Label>Rated</Form.Label>
        <input
          type="checkbox"
          checked={this.state.rated}
          onClick={
            (event: any) => this.setState({rated: event.target.checked})
          }
        />
      </Form.Group>
      {
        this.state.availableDecks.length > 1 && [
          <Form.Group
            controlId="first-deck"
          >
            <Form.Control
              as="select"
              name="first-deck"
              onChange={(event) => this.setState({firstDeckId: event.target.value})}
              value={this.state.firstDeckId}
            >
              <option value="">Random</option>
              {
                this.state.availableDecks.filter(
                  (deck) => deck.id != this.state.secondDeckId
                ).map(
                  (deck) => <option value={deck.id}>{`${deck.name} - ${deck.user.username} - ${deck.id}`}</option>
                )
              }
            </Form.Control>
          </Form.Group>,
          <Form.Group
            controlId="second-deck"
          >
            <Form.Control
              as="select"
              name="second-deck"
              onChange={(event) => this.setState({secondDeckId: event.target.value})}
              value={this.state.secondDeckId}
            >
              <option value="">Random</option>
              {
                this.state.availableDecks.filter(
                  (deck) => deck.id != this.state.firstDeckId
                ).map(
                  (deck) => <option value={deck.id}>{`${deck.name} - ${deck.user.username} - ${deck.id}`}</option>
                )
              }
            </Form.Control>
          </Form.Group>,
        ]
      }
      <Button
        type="submit"
        style={
          {
            marginBottom: '2em',
          }
        }
      >
        New Quick Match
      </Button>
    </Form>
  }

}