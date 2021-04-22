import React from 'react';

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {PrintingNode, Trap} from "../../models/models";
import {Alert} from "react-bootstrap";
import {NodeTreeBuilder} from "../nodes/NodeTreeBuilder";
import {MultiplicityList} from "../../models/utils";


interface TrapParseViewFormProps {
  handleSubmit: ({node, intentionType}: { node: PrintingNode, intentionType: string }) => void
}

interface TrapParseViewFormState {
  node: PrintingNode
}


class TrapParseViewForm extends React.Component<TrapParseViewFormProps, TrapParseViewFormState> {

  constructor(props: TrapParseViewFormProps) {
    super(props);
    this.state = {
      node: new PrintingNode(null, new MultiplicityList(), 'AllNode'),
    }
  }

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        node: this.state.node,
        intentionType: event.target.elements.intentionType.value,
      }
    );
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <NodeTreeBuilder node={this.state.node} changed={node => this.setState({node})}/>
      <Form.Group controlId="intentionType">
        <Form.Label>Intention Type</Form.Label>
        <Form.Control as="select">
          <option>SYNERGY</option>
          <option>OR</option>
        </Form.Control>
      </Form.Group>
      <Button
        type="submit"
        disabled={!this.state.node.children.items.length}
      >
        Add Trap
      </Button>
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

  handleSubmit = ({node, intentionType}: { node: PrintingNode, intentionType: string }): void => {
    this.props.onSubmit(
      new Trap(
        null,
        node,
        intentionType,
        null,
      )
    );
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
