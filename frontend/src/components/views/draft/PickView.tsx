import React from 'react';

import {Pick, SinglePick, BurnPick} from "../../models/models";
import {ImageableImage} from "../../images";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";


interface PickViewProps {
  pick: Pick;
}


export default class PickView extends React.Component<PickViewProps, null> {

  render() {
    if (this.props.pick instanceof SinglePick) {
      return <Row>
        <Col>
          <h5>Pick</h5>
        </Col>
        <Col>
          <ImageableImage
            imageable={this.props.pick.pick}
            sizeSlug="small"
          />
        </Col>
      </Row>
    } else if (this.props.pick instanceof BurnPick) {
      return <Row>
        <Col>
          <h5>Pick</h5>
          <ImageableImage
            imageable={this.props.pick.pick}
            sizeSlug="small"
          />
        </Col>
        {
          this.props.pick.burn ? <Col>
            <h5>Burn</h5>
            <ImageableImage
              imageable={this.props.pick.burn}
              sizeSlug="small"
            />
          </Col> : undefined
        }
      </Row>
    }

  }

}
