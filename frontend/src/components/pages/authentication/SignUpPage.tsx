import React from 'react';

import queryString from 'query-string';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {signUp} from "../../auth/controller";
import {connect} from "react-redux";
import {Redirect} from "react-router";


interface SignUpFormProps {
  handleSubmit: (
    {username, password, email, inviteToken}:
      { username: string, password: string, email: string, inviteToken: string }
  ) => void
  inviteCode: string
}

class SignUpForm extends React.Component<SignUpFormProps> {

  public static defaultProps = {
    inviteCode: ""
  };

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        username: event.target.elements.username.value,
        email: event.target.elements.email.value,
        password: event.target.elements.password.value,
        inviteToken: event.target.elements.inviteToken.value,
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
      <Form.Group controlId="inviteToken">
        <Form.Label>Invite Code</Form.Label>
        <Form.Control type="text" defaultValue={this.props.inviteCode}/>
      </Form.Group>
      <Button type="submit">Sign Up</Button>
    </Form>
  }

}


interface SignUpPageProps {
  authenticated: boolean
  signUp: (
    {username, password, email, inviteToken}:
      { username: string, password: string, email: string, inviteToken: string }
  ) => void
  match: any
  location: any
}

class SignUpPage extends React.Component<SignUpPageProps> {

  handleSubmit = (
    {username, password, email, inviteToken}:
      { username: string, password: string, email: string, inviteToken: string }
  ) => {
    this.props.signUp({username, password, email, inviteToken});
  };

  getInviteCode = (): string => {
    const queryOptions = queryString.parse(this.props.location.search);
    return !queryOptions['invite_code'] ?
      ""
      : (queryOptions['invite_code'] instanceof Array ?
          queryOptions['invite_code'][0]
          : queryOptions['invite_code']
      ) as string;
  };

  render() {
    if (this.props.authenticated) {
      return <Redirect to="/"/>
    }

    return <Container>
      <Col>
        <Card>
          <Card.Header>
            Sign up
          </Card.Header>
          <Card.Body>
            <SignUpForm
              handleSubmit={this.handleSubmit}
              inviteCode={this.getInviteCode()}
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
    signUp: (
      {username, password, email, inviteToken}:
        { username: string, password: string, email: string, inviteToken: string }
    ) => {
      return dispatch(signUp({username, password, email, inviteToken}));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignUpPage);
