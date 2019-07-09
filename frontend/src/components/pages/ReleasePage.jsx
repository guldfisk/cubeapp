import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import {Link} from "react-router-dom";

import {Loading} from '../utils.jsx';
import {CubeRelease} from '../models/models.js';
import ReleaseMultiView from '../views/releaseview/ReleaseMultiView.jsx'
import Button from "react-bootstrap/Button";


class ReleasePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      release: null,
    };
  }

  componentDidMount() {
    CubeRelease.get(
      this.props.match.params.id
    ).then(
      release => {
        this.setState({release})
      }
    );
  }

  render() {
    let release = <Loading/>;
    if (this.state.release !== null) {
      release = <ReleaseMultiView
      cube={this.state.release}
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
          {release}
        </Col>
      </Row>
    </Container>
  }

}

export default ReleasePage;