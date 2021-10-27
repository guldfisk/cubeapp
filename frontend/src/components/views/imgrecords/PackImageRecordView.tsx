import React from 'react';

import Card from "react-bootstrap/Card";

import {PackImageRecord} from "../../models/models";
import DraftPickView from "../draft/DraftPickView";
import {DateListItem} from "../../utils/listitems";
import {roundToN} from "../../utils/utils";
import {Link} from "react-router-dom";


interface PackImageRecordViewProps {
  record: PackImageRecord
}


interface PackImageRecordViewState {
}

export default class PackImageRecordView extends React.Component<PackImageRecordViewProps, PackImageRecordViewState> {

  constructor(props: PackImageRecordViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <Card>
      <Card.Header
        className="d-flex justify-content-between panel-heading"
      >
        <Link
          to={'/image-record/' + this.props.record.id + '/'}
        >
          {'Image record by ' + this.props.record.seat.user.username}
        </Link>
        <DateListItem date={this.props.record.pick.createdAt}/>
        <Link
          to={'/seat/' + this.props.record.seat.id + '/' + this.props.record.pick.globalPickNumber + '/'}
        >
          {this.props.record.pick.pp()}
        </Link>
        <Link
          to={'/release/' + this.props.record.release.id + '/'}
        >
          {this.props.record.release.name}
        </Link>
        <label>{'Image quantity: ' + this.props.record.imageAmount}</label>
        <label>{'Avr. image quantity: ' + roundToN(this.props.record.averageImageAmount)}</label>
        <label>{'Prob. at least this many images: ' + roundToN(this.props.record.probability * 100, 5) + '%'}</label>
      </Card.Header>
      <Card.Body>
        <DraftPickView pick={this.props.record.pick}/>
      </Card.Body>
    </Card>
  }

}