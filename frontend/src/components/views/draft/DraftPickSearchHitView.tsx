import React from 'react';

import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import CubeablesCollectionSpoilerView from "../cubeablescollectionview/CubeablesCollectionSpoilerView";
import PickView from "./PickView";
import {DraftPickSearchHit} from "../../models/models";
import {Link} from "react-router-dom";


interface DraftPickSearchHitViewProps {
  hit: DraftPickSearchHit;
}


interface DraftPickSearchHitViewState {
}


export default class DraftPickSearchHitView extends React.Component<DraftPickSearchHitViewProps, DraftPickSearchHitViewState> {

  constructor(props: DraftPickSearchHitViewProps) {
    super(props);
    this.state = {
      exporting: false,
      viewType: 'Images',
      sampleHand: null,
    }
  }

  render() {

    return <>
      <Card>
        <Card.Header
          className="d-flex justify-content-between panel-heading"
        >
          <span className="header-item">
            {}
            <Link
              to={`/seat/${this.props.hit.pick.seat.id}/${this.props.hit.pick.globalPickNumber}/`}
            >
              {this.props.hit.pick.pp()}
            </Link>
          </span>
        </ Card.Header>
        < Card.Body>
          < Container
            fluid
          >
            <Row>
              <Col>
                <CubeablesCollectionSpoilerView
                  cubeableType='Cubeables'
                  cubeablesContainer={this.props.hit.matches}
                  sizeSlug='small'
                />
              </Col>
              <Col>
                <Row>
                  <PickView
                    pick={this.props.hit.pick.pick}
                    sizeSlug='thumbnail'
                  />
                </Row>
                <Row>
                  <CubeablesCollectionSpoilerView
                    cubeableType='Cubeables'
                    cubeablesContainer={this.props.hit.pick.pack.cubeables}
                  />
                </Row>
              </Col>
            </Row>

          </Container>
        </Card.Body>
      </ Card>
    </>
  }
};
