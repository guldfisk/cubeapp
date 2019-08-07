import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import {Redirect} from "react-router-dom";

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {Patch} from "../../models/models";


interface CreatePatchPageFormProps {
  handleSubmit: ({description}: { description: string }) => void
}

class CreatePatchPageForm extends React.Component<CreatePatchPageFormProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        description: event.target.elements.description.value,
      }
    );
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Group controlId="description">
        <Form.Label>Description</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Button type="submit">Create Patch</Button>
    </Form>
  }

}


interface CreatePatchPageProps {
  match: any
}

interface CreatePatchPageState {
  success: boolean
  patch: Patch | null
}

export default class CreatePatchPage extends React.Component<CreatePatchPageProps, CreatePatchPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      success: false,
      patch: null,
    }
  };

  handleSubmit = ({description}: { description: string }): void => {
    Patch.create(
      this.props.match.params.id,
      description,
    ).then(
      (patch: Patch) => {
        this.setState(
          {
            success: true,
            patch,
          }
        )
      }
    );
  };

  render() {
    if (this.state.success) {
      return <Redirect
        to={"/patch/" + this.state.patch.id()}
      />
    }

    return <Container>
      <Col>
        <Card>
          <Card.Header>
            Create Cube Patch
          </Card.Header>
          <Card.Body>
            <CreatePatchPageForm
              handleSubmit={this.handleSubmit}
            />
          </Card.Body>
        </Card>
      </Col>
    </Container>
  }

}
