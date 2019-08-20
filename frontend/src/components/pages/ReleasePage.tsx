import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"

import {Link} from "react-router-dom";

import {Loading} from '../utils/utils';
import {CubeRelease} from '../models/models';
import ReleaseMultiView from '../views/releaseview/ReleaseMultiView'
import ConstrainedNodesView from '../views/constrainednodesview/ConstrainedNodesView';
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";


interface ReleasePageProps {
  match: any
}

interface ReleasePageState {
  release: null | CubeRelease
}

class ReleasePage extends React.Component<ReleasePageProps, ReleasePageState> {

  constructor(props: ReleasePageProps) {
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
      element = <Tabs
        id="release-info-tabs"
        defaultActiveKey="cards"
        mountOnEnter={true}
      >
        <Tab eventKey="cards" title="Cards">
          <ReleaseMultiView
            release={this.state.release}
          />
        </Tab>
        <Tab eventKey="nodes" title="Nodes" disabled={this.state.release.constrainedNodes == null}>
          {
            this.state.release.constrainedNodes == null ?
              <div/> :
              <ConstrainedNodesView
                constrainedNodes={this.state.release.constrainedNodes}
              />
          }
        </Tab>
      </Tabs>
    }

    return element;

  }

}

export default ReleasePage;