import React from 'react';

import {Link} from "react-router-dom";

import {getDelta, Loading} from '../utils.jsx';
import {Delta} from '../models/models.js';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

import DeltaView from '../deltaview/DeltaView.jsx';


class DeltaPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      delta: null,
    };
  }

  componentDidMount() {
    getDelta(this.props.match.params.id).then(
      response => {
        this.setState(
          {
            delta: new Delta(response.data)
          }
        );
      }
    )

  }

  render() {
    let delta = <Loading/>;
    if (this.state.delta !== null) {
      delta = <DeltaView
        delta={this.state.delta}
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
              <p><Link to={"#"}>Something</Link></p>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          {delta}
        </Col>
      </Row>
    </Container>
  }

}

export default DeltaPage;