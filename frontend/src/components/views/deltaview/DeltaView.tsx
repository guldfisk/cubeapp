import React from 'react';

import Card from "react-bootstrap/Card";

import {Loading} from "../../utils/utils";
import {Cube, CubeRelease, Delta, Printing} from '../../models/models';
import CubeView from "../cubeview/CubeView";
import SearchView from '../search/SearchView';
// import ReleaseListView from "../releaseview/ReleaseListView";
import Row from "react-bootstrap/Row";
import {Col} from "react-bootstrap";


interface DeltaViewProps {
  delta: Delta
}

interface DeltaViewState {
  cube: Cube
  release: CubeRelease
  printings: Printing[]

}

class DeltaView extends React.Component<DeltaViewProps, DeltaViewState> {

  constructor(props: DeltaViewProps) {
    super(props);
    this.state = {
      cube: null,
      release: null,
      printings: [],
    };
  }

  componentDidMount() {
    // Cube.get(
    //   this.props.delta.cube().id()
    // ).then(
    //   cube => {
    //     this.setState({cube})
    //   }
    // ).then(
    //   () => {
    //     if (this.state.cube.latestRelease() === null) {
    //       return;
    //     }
    //     CubeRelease.get(
    //       this.state.cube.latestRelease().id()
    //     ).then(
    //       release => {
    //         this.setState({release})
    //       }
    //     )
    //   }
    // );
  }

  render() {
    console.log(this.state.printings);
    // const cube = this.state.cube === null ? <Loading/> : <CubeView cube={this.state.cube}/>;
    // const release = this.state.release === null ? <Loading/> : <ReleaseListView release={this.state.release}/>;

    return <Card>
      <Card.Header className="panel-heading">
        <span className="badge badge-secondary">{this.props.delta.description()}</span>
        <span className="badge badge-secondary">{this.props.delta.author().username()}</span>
        <span className="badge badge-secondary">{this.props.delta.createdAt()}</span>
      </Card.Header>
      <Card.Body className="panel-body">
        <Row>
          <Col>
          <SearchView
            handleCardClicked={
              (printing: Printing) => {
                this.setState(
                  {
                    printings: this.state.printings.concat([printing,])
                  }
                )
              }
            }
          />
        </Col>
        <Col>
          <ul>
            {
              this.state.printings.map(
                (printing: Printing) => <li>{printing.name()}</li>
              )
            }
          </ul>
        </Col>
        </Row>
      </Card.Body>
    </Card>

  }

}

export default DeltaView;