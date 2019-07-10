import React from 'react';

import Card from "react-bootstrap/Card";

import {Loading} from "../../utils";
import {Cube, CubeRelease} from '../../models/models.js';
import CubeView from "../cubeview/CubeView.jsx";
import ReleaseListView from "../releaseview/ReleaseListView.jsx";
import Row from "react-bootstrap/Row";


class DeltaView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cube: null,
      release: null,
    };
  }

  componentDidMount() {
    Cube.get(
      this.props.delta.cube().id()
    ).then(
      cube => {
        this.setState({cube})
      }
    ).then(
      () => {
        if (this.state.cube.latestRelease() === null) {
          return;
        }
        CubeRelease.get(
          this.state.cube.latestRelease().id()
        ).then(
          release => {
            this.setState({release})
          }
        )
      }
    );
  }

  render() {
    const cube = this.state.cube === null ? <Loading/> : <CubeView cube={this.state.cube}/>;
    const release = this.state.release === null ? <Loading/> : <ReleaseListView cube={this.state.release}/>;

    return <Card>
      <Card.Header className="panel-heading">
        <span className="badge badge-secondary">{this.props.delta.description()}</span>
        <span className="badge badge-secondary">{this.props.delta.author().username()}</span>
        <span className="badge badge-secondary">{this.props.delta.createdAt()}</span>
      </Card.Header>
      <Card.Body className="panel-body">
        <Row>
          {cube}
          {release}
        </Row>
      </Card.Body>
    </Card>

  }

}

export default DeltaView;