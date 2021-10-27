import React from 'react';

import {Pick, SinglePick, BurnPick} from "../../models/models";
import {ImageableImage} from "../../images";
import Col from "react-bootstrap/Col";


interface PickViewProps {
  pick: Pick;
  sizeSlug: string,
}


export default class PickView extends React.Component<PickViewProps, null> {

  static defaultProps = {
    sizeSlug: 'small',
  };

  render() {
    if (this.props.pick instanceof SinglePick) {
      return <Col>
        <h5>Pick</h5>
        <ImageableImage
          imageable={this.props.pick.pick}
          sizeSlug={this.props.sizeSlug}
        />
      </Col>
    } else if (this.props.pick instanceof BurnPick) {
      return <>
        <Col>
          <h5>Pick</h5>
          <ImageableImage
            imageable={this.props.pick.pick}
            sizeSlug={this.props.sizeSlug}
          />
        </Col>
        {
          this.props.pick.burn ? <Col>
            <h5>Burn</h5>
            <ImageableImage
              imageable={this.props.pick.burn}
              sizeSlug={this.props.sizeSlug}
            />
          </Col> : undefined
        }
      </>
    }

  }

}
