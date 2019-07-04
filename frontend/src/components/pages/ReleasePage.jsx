import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import {Link} from "react-router-dom";

import {getCube, Loading} from '../utils.jsx';
import {CubeRelease} from '../models/models.js';
import ReleaseMultiView from '../releaseview/ReleaseMultiView.jsx'


class ReleasePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  componentDidMount() {
    console.log(this.props);
    getCube(this.props.match.params.id).then(
      response => {
        this.setState(
          {
            cube: new CubeRelease(response.data),
          }
        )
      }
    )
  }

  render() {
    let cube = <Loading/>;
    if (this.state.cube !== null) {
      cube = <ReleaseMultiView
      cube={this.state.cube}
    />
    }

    return <Container fluid>
      <Row>
        <Col sm={2}>
          <Card>
            <Card.Header>
              Actions
            </Card.Header>
            <Card.Body>
              <p><Link to={"#"}>Search</Link></p>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          {cube}
        </Col>
      </Row>
    </Container>
  }

}

export default ReleasePage;