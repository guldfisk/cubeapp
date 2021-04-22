import React from 'react';

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {ConstrainedNode, PrintingNode} from "../../models/models";
import {Alert} from "react-bootstrap";
import {MultiplicityList} from "../../models/utils";
import {NodeTreeBuilder} from "../nodes/NodeTreeBuilder";


interface NodeParseFormProps {
  handleSubmit: (
    {node, groups, weight}:
      { node: PrintingNode, groups: string, weight: number }
  ) => void
}


interface NodeParseFormState {
  node: PrintingNode
  weight: number
}


class NodeParseForm extends React.Component<NodeParseFormProps, NodeParseFormState> {

  constructor(props: NodeParseFormProps) {
    super(props);
    this.state = {
      node: new PrintingNode(null, new MultiplicityList(), 'AllNode'),
      weight: 1,
    }
  }

  handleSubmit = (event: any) => {
    if (this.state.node.children.items.length) {
      this.props.handleSubmit(
        {
          node: this.state.node,
          groups: event.target.elements.groups.value,
          weight: parseInt(event.target.elements.weight.value),
        }
      );
    }
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <NodeTreeBuilder node={this.state.node} changed={node => this.setState({node})}/>
      <Form.Group controlId="groups">
        <Form.Label>Groups</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="weight">
        <Form.Label>Weight</Form.Label>
        <Form.Control
          type="number"
          value={this.state.weight}
          onChange={event => this.setState({weight: parseInt(event.target.value)})}
          min={0}
        />
      </Form.Group>
      <Button
        type="submit"
        disabled={!this.state.node.children.items.length}
      >
        Add Node
      </Button>
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

  handleSubmit = ({node, groups, weight}: { node: PrintingNode, groups: string, weight: number }): void => {
    this.props.onSubmit(
      new ConstrainedNode(
        null,
        node,
        weight,
        groups.split(', '),
      )
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
