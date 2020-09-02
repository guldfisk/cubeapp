import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

import {resetPassword} from "../../auth/controller";


interface ResetFormProps {
  handleSubmit: (
    {username, email}:
      { username: string, email: string }
  ) => void
}


class ResetForm extends React.Component<ResetFormProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        username: event.target.elements.username.value,
        email: event.target.elements.email.value,
      }
    );
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Group controlId="username">
        <Form.Label>Username</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="email">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email"/>
      </Form.Group>
      <Button type="submit">Reset</Button>
    </Form>
  }

}


interface ResetPageProps {
}


interface ResetPageState {
  errorMessage: null | string
  success: boolean

}


export default class ResetPage extends React.Component<ResetPageProps, ResetPageState> {

  constructor(props: ResetPageProps) {
    super(props);
    this.state = {
      errorMessage: null,
      success: false,
    }
  }

  handleSubmit = (
    {username, email}:
      { username: string, email: string }
  ) => {
    resetPassword(username, email).then(
      () => this.setState({success: true, errorMessage: null})
    ).catch(
      (error: any) => this.setState({success: false, errorMessage: error.response.data.toString()})
    )
  };

  render() {
    return <Container>
      <Col>
        {
          this.state.success && <Alert
            variant="success"
          >
            Reset email sent
          </Alert>
        }
        {
          !this.state.errorMessage ? undefined : <Alert
            variant="danger"
          >
            {this.state.errorMessage}
          </Alert>
        }
        <Card>
          <Card.Header>
            Reset Password
          </Card.Header>
          <Card.Body>
            <ResetForm
              handleSubmit={this.handleSubmit}
            />
          </Card.Body>
        </Card>
      </Col>
    </Container>
  }

}
