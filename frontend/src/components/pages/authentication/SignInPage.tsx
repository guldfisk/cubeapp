import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {Redirect} from "react-router";
import Alert from "react-bootstrap/Alert";
import {signIn} from "../../auth/controller";
import {connect} from "react-redux";
import {Link} from "react-router-dom";


interface SignInFormProps {
  handleSubmit: ({username, password}: { username: string, password: string }) => void
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
  errorMessage: null | string
  signIn: (username: string, password: string) => void
}


class SignInPage extends React.Component<SignInPageProps> {

  handleSubmit = ({username, password}: { username: string, password: string }) => {
    this.props.signIn(username, password);
  };

  render() {
    if (this.props.authenticated) {
      return <Redirect to="/"/>
    }

    return <Container>
      <Col>
        {
          !this.props.errorMessage ? undefined : <Alert
            variant="danger"
          >
            {this.props.errorMessage}
          </Alert>
        }
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
        <Link to={"/reset-password"}>Forgot password?</Link>
      </Col>
    </Container>
  }

}


const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    errorMessage: state.errorMessage,
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
