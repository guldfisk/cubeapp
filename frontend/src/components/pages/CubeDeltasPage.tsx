import React from 'react';

import {Delta} from '../models/models';

import DeltasView from '../views/deltaview/DeltasView';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import {Link} from "react-router-dom";


interface CubeDeltasPageProps {
  match: any
}

interface CubeDeltasPageState {
  deltas: Delta[]
}

class CubeDeltasPage extends React.Component<CubeDeltasPageProps, CubeDeltasPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      deltas: [],
    };
  }

  componentDidMount() {
    Delta.forCube(
      this.props.match.params.id
    ).then(
      deltas => {
        this.setState({deltas})
      }
    );
  }

  render() {

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
          <DeltasView
            deltas={this.state.deltas}
          />
        </Col>
      </Row>
    </Container>
  }

}

export default CubeDeltasPage;