import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import {get_cube, Loading} from '../utils.jsx';
import CubeModel from '../cubemodel.js'
import CubeMultiView from '../cubeview/CubeMultiView.jsx'


class CubeViewPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  componentDidMount() {
    get_cube(this.props.match.params.cubeId).then(
      response => {
        this.setState(
          {
            cube: new CubeModel(response.data),
          }
        )
      }
    )
  }

  render() {
    let cube = <Loading/>;
    if (this.state.cube !== null) {
      cube = <CubeMultiView
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

export default CubeViewPage;