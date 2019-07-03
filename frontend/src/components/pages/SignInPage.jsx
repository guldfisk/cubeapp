import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {connect} from "react-redux";

import {signIn} from '../auth/controller.js';


class SignInForm extends React.Component {

  handleSubmit = (event) => {
    this.props.handleSubmit(
      {
        username: event.target.elements.username.value,
        password: event.target.elements.password.value,
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
      <Button type="submit">Sign In</Button>
    </Form>
  }

}


class SignInPage extends React.Component {

  handleSubmit = ({username, password}) => {
    this.props.signIn(username, password);
  };

  render() {
    return <Container>
        <Col>
          <Card>
            <Card.Header>
              Sign in
            </Card.Header>
            <Card.Body>
              <SignInForm
                handleSubmit={this.handleSubmit}
              />
            </Card.Body>
          </Card>
        </Col>
    </Container>
  }

}

const mapStateToProps = state => {
  return {
    authenticated: state.authenticated,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    signIn: (username, password) => {
      return dispatch(signIn(username, password));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignInPage);
