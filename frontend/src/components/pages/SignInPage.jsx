import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";


class SignInForm extends React.Component {

  render() {
    return <Form>
      <Form.Group controlId="username">
        <Form.Label>Username</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="password">
        <Form.Label>Password</Form.Label>
        <Form.Control type="password"/>
      </Form.Group>
    </Form>
  }

}


class SignInPage extends React.Component {

  render() {
    return <Container>
        <Col>
          <Card>
            <Card.Header>
              Sign in
            </Card.Header>
            <Card.Body>
              <SignInForm/>
            </Card.Body>
          </Card>
        </Col>
    </Container>
  }

}


export default SignInPage;