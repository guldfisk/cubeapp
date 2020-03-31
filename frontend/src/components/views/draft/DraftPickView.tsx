import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import {DraftPick} from "../../models/models";
import CubeablesCollectionSpoilerView from "../cubeablescollectionview/CubeablesCollectionSpoilerView";
import PickView from "./PickView";


interface DraftPickViewProps {
  pick: DraftPick;
}


export default class DraftPickView extends React.Component<DraftPickViewProps, null> {

  render() {


    return <Col>
      <Row>
        <PickView pick={this.props.pick.pick}/>
      </Row>
      <Row>
        <Col>
          <h5>Pack</h5>
          <CubeablesCollectionSpoilerView
            cubeableType="Cubeables"
            cubeablesContainer={this.props.pick.pack.cubeables}
          />
        </Col>
      </Row>
    </Col>

  }

}
