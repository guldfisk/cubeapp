import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import {get_cube, Loading} from '../utils.jsx';
import CubeModel from '../cubemodel.js'
import CubeMultiView from '../cubeview/CubeMultiView.jsx'
import Form from "react-bootstrap/Form";


class CreateCubeForm extends React.Component {

  render() {
    return <Form>
      <Form.Group controlId="name">
        <Form.Label>Name</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="target_size">
        <Form.Label>Target Size</Form.Label>
        <Form.Control type="number" placeholder={360}/>
      </Form.Group>
    </Form>
  }

}


class CreateCubePage extends React.Component {

  render() {
    return <Container>
        <Col>
          <Card>
            <Card.Header>
              Create Cube
            </Card.Header>
            <Card.Body>
              <CreateCubeForm/>
            </Card.Body>
          </Card>
        </Col>
    </Container>
  }

}


export default CreateCubePage;