import React from 'react';

import {Patch} from '../models/models';

import PatchesView from '../views/patchview/PatchesView';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import {Link} from "react-router-dom";


interface CubeDeltasPageProps {
  match: any
}

interface CubeDeltasPageState {
  deltas: Patch[]
}

class CubePatchesPage extends React.Component<CubeDeltasPageProps, CubeDeltasPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      deltas: [],
    };
  }

  componentDidMount() {
    Patch.forCube(
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
          <PatchesView
            patches={this.state.deltas}
          />
        </Col>
      </Row>
    </Container>
  }

}

export default CubePatchesPage;