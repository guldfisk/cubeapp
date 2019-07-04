import axios from 'axios';
import React from 'react';

import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import {Redirect} from "react-router-dom";

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {connect} from "react-redux";


class CreateCubeForm extends React.Component {

  handleSubmit = (event) => {
    this.props.handleSubmit(
      {
        name: event.target.elements.name.value,
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
      <Form.Group controlId="name">
        <Form.Label>Name</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="description">
        <Form.Label>Description</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Button type="submit">Create Cube</Button>
    </Form>
  }

}


class CreateCubePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      success: false,
    }
  };

  handleSubmit = ({name, description }) => {
    console.log(this.state.token);
    axios.post(
      "/api/versioned-cubes/",
      {name, description},
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${this.props.token}`,
        }
      },
    ).then(
      response => {
        this.setState({success: true})
      }
    )
  };

  render() {
    if (this.state.success) {
      return <Redirect to="/cubes/"/>
    }

    return <Container>
        <Col>
          <Card>
            <Card.Header>
              Create Cube
            </Card.Header>
            <Card.Body>
              <CreateCubeForm
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
    token: state.token,
  };
};


export default connect(mapStateToProps, null)(CreateCubePage);
