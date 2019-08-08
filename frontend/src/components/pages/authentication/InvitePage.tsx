import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import {inviteUser} from "../../utils/utils";
import Alert from "react-bootstrap/Alert";


interface SignInFormProps {
  handleSubmit: ({email}: { email: string }) => void
}

class InviteForm extends React.Component<SignInFormProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
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
      <Form.Group controlId="email">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email"/>
      </Form.Group>
      <Button type="submit">Send Invite</Button>
    </Form>
  }

}


interface InvitePageState {
  success: boolean
}

export default class InvitePage extends React.Component<null, InvitePageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      success: false,
    }
  }

  handleSubmit = ({email}: { email: string }) => {
    inviteUser(email).then(
      response => {
        this.setState({success: true})
      }
    )
  };

  render() {
    return <Container>
      <Col>
        <Card>
          <Card.Header>
            Invite
          </Card.Header>
          <Card.Body>
            {
              this.state.success &&
              <Alert variant="success">
                Invite send
              </Alert>
            }
            <InviteForm
              handleSubmit={this.handleSubmit}
            />
          </Card.Body>
        </Card>
      </Col>
    </Container>
  }

}
