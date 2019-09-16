import React from 'react';

import {DistributionPossibility} from "../../models/models";
import Row from "react-bootstrap/Row";
import {Col} from 'react-bootstrap';
import PdfView from "../pdf/PdfView";
import TrapCollectionView from "./TrapCollectionView";


interface DistributionPossibilityViewProps {
  possibility: DistributionPossibility
}


export default class DistributionPossibilityView extends React.Component<DistributionPossibilityViewProps> {

  render() {
    return <Row>
      {
        !this.props.possibility.pdfUrl ? undefined :
          <PdfView url={this.props.possibility.pdfUrl} />
      }
      <Col>
        <TrapCollectionView trapCollection={this.props.possibility.trapCollection} />
      </Col>
    </Row>

  }

}