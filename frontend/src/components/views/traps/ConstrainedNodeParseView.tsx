import React from 'react';

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {ConstrainedNode} from "../../models/models";
import {Alert} from "react-bootstrap";


interface NodeParseFormProps {
  handleSubmit: (
    {query, groups, weight}:
      { query: string, groups: string, weight: number }
  ) => void
}


class NodeParseForm extends React.Component<NodeParseFormProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        query: event.target.elements.query.value,
        groups: event.target.elements.groups.value,
        weight: parseInt(event.target.elements.weight.value),
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
        <Form.Label>Node</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="groups">
        <Form.Label>Groups</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="weight">
        <Form.Label>Weight</Form.Label>
        <Form.Control type="number"/>
      </Form.Group>
      <Button type="submit">Add Node</Button>
    </Form>
  }

}


interface CreatePatchPageProps {
  onSubmit: (constrainedNode: ConstrainedNode) => void
}


interface ConstrainedNodeParseViewState {
  errorMessage: string | null
}


export default class ConstrainedNodeParseView extends React.Component<CreatePatchPageProps,
  ConstrainedNodeParseViewState> {

  constructor(props: any) {
    super(props);
    this.state = {
      errorMessage: null
    }
  };

  handleSubmit = ({query, groups, weight}: { query: string, groups: string, weight: number }): void => {
    ConstrainedNode.parse(query, groups, weight).then(
      node => {
        this.setState({errorMessage: null});
        this.props.onSubmit(node);
      }
    ).catch(
      (error: any) => {
        this.setState({errorMessage: error.response.data.toString()});
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
      <NodeParseForm handleSubmit={this.handleSubmit}/>
    </>
  }

}
