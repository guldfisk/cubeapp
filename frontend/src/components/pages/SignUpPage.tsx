import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";


interface SignUpFormProps {
  handleSubmit: (
    {username, email, password, inviteCode}:
      { username: string, email: string, password: string, inviteCode: string }
  ) => void
}

class SignUpForm extends React.Component<SignUpFormProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        username: event.target.elements.username.value,
        email: event.target.elements.email.value,
        password: event.target.elements.password.value,
        inviteCode: event.target.elements.inviteCode.value,
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
      <Form.Group controlId="password">
        <Form.Label>Password</Form.Label>
        <Form.Control type="password"/>
      </Form.Group>
      <Form.Group controlId="email">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email"/>
      </Form.Group>
      <Form.Group controlId="inviteCode">
        <Form.Label>Invite Code</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Button type="submit">Sign Up</Button>
    </Form>
  }

}


// interface SignInPageProps {
//   authenticated: boolean
//   signIn: (username: string, password: string) => void
// }

export default class SignUpPage extends React.Component {

  handleSubmit = ({username, password}: { username: string, password: string }) => {
    // this.props.signIn(username, password);
  };

  render() {
    return <Container>
      <Col>
        <Card>
          <Card.Header>
            Sign up
          </Card.Header>
          <Card.Body>
            <SignUpForm
              handleSubmit={this.handleSubmit}
            />
          </Card.Body>
        </Card>
      </Col>
    </Container>
  }

}
