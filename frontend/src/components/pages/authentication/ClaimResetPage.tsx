import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

import {claimPasswordReset} from "../../auth/controller";
import queryString from "query-string";
import {Redirect} from "react-router";


interface ClaimResetFormProps {
  handleSubmit: (
    {code, newPassword}:
      { code: string, newPassword: string }
  ) => void
  code: string
}


class ClaimResetForm extends React.Component<ClaimResetFormProps> {

  public static defaultProps = {
    code: ""
  };


  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        code: event.target.elements.code.value,
        newPassword: event.target.elements.newPassword.value,
      }
    );
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Group controlId="code">
        <Form.Label>Code</Form.Label>
        <Form.Control type="text" defaultValue={this.props.code}/>
      </Form.Group>
      <Form.Group controlId="newPassword">
        <Form.Label>New password</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Button type="submit">Reset</Button>
    </Form>
  }

}


interface ClaimResetPasswordPageProps {
  location: any
}


interface ClaimResetPasswordPageState {
  errorMessage: null | string
  success: boolean

}


export default class ClaimResetPasswordPage extends React.Component<ClaimResetPasswordPageProps, ClaimResetPasswordPageState> {

  constructor(props: ClaimResetPasswordPageProps) {
    super(props);
    this.state = {
      errorMessage: null,
      success: false,
    }
  }

  handleSubmit = (
    {code, newPassword}:
      { code: string, newPassword: string }
  ) => {
    claimPasswordReset(code, newPassword).then(
      () => this.setState({success: true, errorMessage: null})
    ).catch(
      (error: any) => this.setState({success: false, errorMessage: error.response.data.toString()})
    )
  };

  getCode = (): string => {
    const queryOptions = queryString.parse(this.props.location.search);
    return !queryOptions['code'] ?
      ""
      : (queryOptions['code'] instanceof Array ?
          queryOptions['code'][0]
          : queryOptions['code']
      ) as string;
  };

  render() {
    if (this.state.success) {
      return <Redirect to="/login"/>
    }

    return <Container>
      <Col>
        {
          !this.state.errorMessage ? undefined : <Alert
            variant="danger"
          >
            {this.state.errorMessage}
          </Alert>
        }
        <Card>
          <Card.Header>
            Select new password
          </Card.Header>
          <Card.Body>
            <ClaimResetForm
              handleSubmit={this.handleSubmit}
              code={this.getCode()}
            />
          </Card.Body>
        </Card>
      </Col>
    </Container>
  }

}
