import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import {Link} from "react-router-dom";

import {Loading} from '../utils';
import {CubeRelease} from '../models/models.js';
import ReleaseMultiView from '../views/releaseview/ReleaseMultiView.jsx'
import ConstrainedNodesView from '../views/constrainednodesview/ConstrainedNodesView.jsx';
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";


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
    let element = <Loading/>;
    if (this.state.release !== null) {
      element = <Tabs defaultActiveKey="cards">
        <Tab eventKey="cards" title="Cards">
          <ReleaseMultiView
            cube={this.state.release}
          />
        </Tab>
        <Tab eventKey="nodes" title="Nodes" disabled={this.state.release.constrainedNodes() == null}>
          {
            this.state.release.constrainedNodes() == null ?
              <div/> :
              <ConstrainedNodesView
                constrainedNodes={this.state.release.constrainedNodes()}
              />
          }
        </Tab>
      </Tabs>
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
          {element}
        </Col>
      </Row>
    </Container>
  }

}

export default ReleasePage;