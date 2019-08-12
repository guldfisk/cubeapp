import React from 'react';

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {Trap} from "../../models/models";


interface TrapParseViewFormProps {
  handleSubmit: ({query, intentionType}: { query: string, intentionType: string}) => void
}

class TrapParseViewForm extends React.Component<TrapParseViewFormProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        query: event.target.elements.query.value,
        intentionType: "",
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
      <Button type="submit">Add Trap</Button>
    </Form>
  }

}


interface CreatePatchPageProps {
  onSubmit: (trap: Trap) => void
}

export default class TrapParseView extends React.Component<CreatePatchPageProps> {

  constructor(props: any) {
    super(props);
    this.state = {
      success: false,
      patch: null,
    }
  };

  handleSubmit = ({query, intentionType}: { query: string, intentionType: string}): void => {
    Trap.parse(query).then(
      this.props.onSubmit
    )
  };

  render() {

    return <TrapParseViewForm handleSubmit={this.handleSubmit}/>
  }

}
