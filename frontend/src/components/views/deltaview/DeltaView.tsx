import React from 'react';

import Card from "react-bootstrap/Card";

import {Loading} from "../../utils";
import {Cube, CubeRelease, Delta} from '../../models/models';
import CubeView from "../cubeview/CubeView";
import ReleaseListView from "../releaseview/ReleaseListView";
import Row from "react-bootstrap/Row";



interface DeltaViewProps {
  delta: Delta
}

interface DeltaViewState {
  cube: Cube
  release: CubeRelease
}

class DeltaView extends React.Component<DeltaViewProps, DeltaViewState> {

  constructor(props: DeltaViewProps) {
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
    const release = this.state.release === null ? <Loading/> : <ReleaseListView release={this.state.release}/>;

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