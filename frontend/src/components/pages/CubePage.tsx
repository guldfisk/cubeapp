import React from 'react';

import {Link} from "react-router-dom";

import {Loading} from '../utils/utils';
import CubeView from '../views/cubeview/CubeView';
import {Cube} from '../models/models';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";


interface CubePageProps {
  match: any
}

interface CubepageState {
  cube: null | Cube
}

class CubePage extends React.Component<CubePageProps, CubepageState> {

  constructor(props: CubePageProps) {
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
              <p><Link to={'/cube/' + this.props.match.params.id + '/deltas/'}>Deltas</Link></p>
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