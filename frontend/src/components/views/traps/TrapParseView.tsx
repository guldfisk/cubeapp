import React from 'react';

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {Trap} from "../../models/models";
import {Alert} from "react-bootstrap";


interface TrapParseViewFormProps {
  handleSubmit: ({query, intentionType}: { query: string, intentionType: string }) => void
}


class TrapParseViewForm extends React.Component<TrapParseViewFormProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        query: event.target.elements.query.value,
        intentionType: event.target.elements.intentionType.value,
        // intentionType: "SYNERGY",
      }
    );
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Group controlId="query">
        <Form.Label>Trap</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="intentionType">
        <Form.Label>Intention Type</Form.Label>
        <Form.Control as="select">
          <option>SYNERGY</option>
          <option>OR</option>
        </Form.Control>
      </Form.Group>
      <Button type="submit">Add Trap</Button>
    </Form>
  }

}


interface TrapParseViewProps {
  onSubmit: (trap: Trap) => void
}


interface TrapParseViewState {
  errorMessage: null | string
}

export default class TrapParseView extends React.Component<TrapParseViewProps, TrapParseViewState> {

  constructor(props: any) {
    super(props);
    this.state = {
      errorMessage: null
    }
  };

  handleSubmit = ({query, intentionType}: { query: string, intentionType: string }): void => {
    Trap.parse(query, intentionType).then(
      (trap: Trap) => {
        this.setState({errorMessage: null});
        this.props.onSubmit(trap);
      }
    ).catch(
      (error: any) => {
        this.setState({errorMessage: error.response.data.toString()})
      }
    )
  };

  render() {
    return <>
      {
        !this.state.errorMessage ? undefined : <Alert
          variant="danger"
        >
          {this.state.errorMessage}
        </Alert>
      }
      <TrapParseViewForm handleSubmit={this.handleSubmit}/>
    </>
  }

}
