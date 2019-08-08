import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {connect} from "react-redux";

import {signIn} from '../../auth/controller';
import {Redirect} from "react-router";


interface SignInFormProps {
  handleSubmit: ({username, password}: {username: string, password: string}) => void
}

class SignInForm extends React.Component<SignInFormProps> {

  handleSubmit = (event: any) => {
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


interface SignInPageProps {
  authenticated: boolean
  signIn: (username: string, password: string) => void
}

class SignInPage extends React.Component<SignInPageProps> {

  handleSubmit = ({username, password}: {username: string, password: string}) => {
    this.props.signIn(username, password);
  };

  render() {
    if (this.props.authenticated) {
      return <Redirect to="/"/>
    }

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

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    signIn: (username: string, password: string) => {
      return dispatch(signIn(username, password));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignInPage);
