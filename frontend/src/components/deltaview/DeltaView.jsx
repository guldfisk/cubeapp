import React from 'react';

import Card from "react-bootstrap/Card";

import {getCube, getRelease, Loading} from "../utils.jsx";
import {Cube, CubeRelease} from '../models/models.js';
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
    getCube(this.props.delta.cube().id()).then(
      response => {
        this.setState(
          {
            cube: new Cube(response.data)
          }
        )
      }
    ).then(
      () => {
        if (this.state.cube.latestRelease() === null) {
          return;
        }
        getRelease(this.state.cube.latestRelease().id()).then(
          response => {
            this.setState(
              {
                release: new CubeRelease(response.data)
              }
            )
          }
        )
      }
    )
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