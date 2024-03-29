import React from 'react';

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row";
import {Link} from "react-router-dom";
import {Loading} from '../../utils/utils';
import {Modal} from "react-bootstrap";

import ConstrainedNodesView from '../../views/constrainednodesview/ConstrainedNodesView';
import GroupMapView from "../../views/groupmap/GroupMapView";
import history from '../../routing/history';
import InfinitesView from "../../views/infinites/InfinitesView";
import ReleaseMultiView from '../../views/releaseview/ReleaseMultiView'
import ReleasesView from "../../views/releaseview/ReleasesView";
import {Cube, CubeRelease, CubeReleaseMeta} from '../../models/models';
import RoutedTabs from "../../utils/RoutedTabs";


interface ReleaseSelectionDialogProps {
  currentRelease: CubeRelease;
  show: boolean
  onCancel: () => void
  onReleaseClicked: (cubeReleaseMeta: CubeReleaseMeta) => void
}


interface ReleaseSelectionDialogState {
  cube: Cube | null
}


class ReleaseSelectionDialog extends React.Component<ReleaseSelectionDialogProps, ReleaseSelectionDialogState> {

  constructor(props: ReleaseSelectionDialogProps) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  render() {
    return <Modal
      show={this.props.show}
      onEnter={
        () => {
          if (this.state.cube) {
            return
          }
          Cube.get(this.props.currentRelease.cube.id).then(
            cube => this.setState({cube})
          )
        }
      }
    >
      <Modal.Header closeButton>
        <Modal.Title>Select release</Modal.Title>
      </Modal.Header>
      {
        !this.state.cube ? <Loading/> :
          <ReleasesView
            releases={
              this.state.cube.releases.filter(
                release => release.createdAt < this.props.currentRelease.createdAt
              )
            }
            onReleaseClicked={this.props.onReleaseClicked}
          />
      }

      <Modal.Footer>
        <Button variant="secondary" onClick={this.props.onCancel}>Close</Button>
      </Modal.Footer>
    </Modal>
  }
}


interface ReleasePageProps {
  match: any
}

interface ReleasePageState {
  release: null | CubeRelease
  selectingCompareRelease: boolean

}

class ReleasePage extends React.Component<ReleasePageProps, ReleasePageState> {

  constructor(props: ReleasePageProps) {
    super(props);
    this.state = {
      release: null,
      selectingCompareRelease: false,
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
      element = <RoutedTabs
        match={this.props.match}
        tabs={
          [
            [
              'cards',
              'Cards',
              () => <ReleaseMultiView release={this.state.release}/>,
            ],
            [
              'nodes',
              'Nodes',
              () => this.state.release.constrainedNodes == null ?
                <div/> :
                <ConstrainedNodesView
                  constrainedNodes={this.state.release.constrainedNodes}
                  search
                />,
            ],
            [
              'infinites',
              'Infinites',
              () => this.state.release.infinites == null ?
                <div/> :
                <InfinitesView
                  infinites={this.state.release.infinites}
                />,
            ],
            [
              'groups',
              'Groups',
              () => this.state.release.groupMap == null ?
                <div/> :
                <GroupMapView
                  groupMap={this.state.release.groupMap}
                  search
                />,
            ],
          ]
        }
        defaultTab="cards"
      />
    }

    return <>
      {
        !this.state.release ? undefined :
          <ReleaseSelectionDialog
            currentRelease={this.state.release}
            show={this.state.selectingCompareRelease}
            onCancel={() => this.setState({selectingCompareRelease: false})}
            onReleaseClicked={
              release => {
                history.push(
                  '/release/' + this.props.match.params.id + '/delta-from/' + release.id
                )
              }
            }
          />
      }
      <Container
        fluid
      >
        <Row>
          <Col sm={2}>
            <Card>
              <Card.Header>
                Actions
              </Card.Header>
              <Card.Body>
                <p>
                  <Link
                    to='#'
                    onClick={() => this.setState({selectingCompareRelease: true})}
                    className={!this.state.release ? 'disabled-link' : 'enabled-link'}
                  >
                    Compare
                  </Link>
                </p>
                <p>
                  <Link to={'/release/' + this.props.match.params.id + '/sample-pack/'}>
                    Sample pack
                  </Link>
                </p>
                <p>
                  <Link to={'/release/' + this.props.match.params.id + '/ratings/'}>
                    Ratings
                  </Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            {element}
          </Col>
        </Row>
      </Container>
    </>;

  }

}

export default ReleasePage;