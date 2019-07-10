import React from 'react';

import {Link} from "react-router-dom";

import {Loading} from '../utils';
import CubeView from '../views/cubeview/CubeView.jsx';
import {Cube} from '../models/models.js';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";


class CubePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  componentDidMount() {
    Cube.get(this.props.match.params.id).then(
      cube => {
        this.setState({cube})
      }
    );
  }

  render() {
    let cube = <Loading/>;
    if (this.state.cube !== null) {
      cube = <CubeView
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
              <p><Link to={"#"}>New Delta</Link></p>
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

export default CubePage