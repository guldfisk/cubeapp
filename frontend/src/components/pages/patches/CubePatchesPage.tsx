import React from 'react';

import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import {Link} from "react-router-dom";

import PatchesView from '../../views/patchview/PatchesView';
import {ReleasePatch} from '../../models/models';


interface CubeDeltasPageProps {
  match: any
}

interface CubeDeltasPageState {
  patches: ReleasePatch[]
}

class CubePatchesPage extends React.Component<CubeDeltasPageProps, CubeDeltasPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      patches: [],
    };
  }

  componentDidMount() {
    ReleasePatch.forCube(
      this.props.match.params.id
    ).then(
      ({objects}) => {
        this.setState({patches: objects})
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
              <p><Link to={"create"}>New Patch</Link></p>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <PatchesView
            patches={this.state.patches}
          />
        </Col>
      </Row>
    </Container>
  }

}

export default CubePatchesPage;