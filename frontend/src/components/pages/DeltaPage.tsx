import React from 'react';

import {Link} from "react-router-dom";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

import {Loading} from '../utils/utils';
import {Delta} from '../models/models';
import DeltaView from '../views/deltaview/DeltaView';


interface DeltaPageProps {
  match: any
}

interface DeltaPageState {
  delta: null | Delta
}

class DeltaPage extends React.Component<DeltaPageProps, DeltaPageState> {

  constructor(props: DeltaPageProps) {
    super(props);
    this.state = {
      delta: null,
    };
  }

  componentDidMount() {
    Delta.get(
      this.props.match.params.id
    ).then(
      delta => {
        this.setState({delta})
      }
    );

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