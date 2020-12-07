import React from 'react';

import {DistributionPossibility, TrapCollection} from "../../models/models";
import Row from "react-bootstrap/Row";
import PdfView from "../pdf/PdfView";
import TrapCollectionView from "./TrapCollectionView";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";


interface CollectionWithPdfProps {
  trapCollection: TrapCollection
  pdfUrl: string | null
  name: string
}


class CollectionWithPdf extends React.Component<CollectionWithPdfProps> {

  render() {
    return <Row>
      <Card>
        <Card.Header>
          {this.props.name}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col>
              {
                !this.props.pdfUrl ? undefined :
                  <PdfView
                    url={this.props.pdfUrl}
                    downloadable={true}
                  />
              }
            </Col>
            <Col>
              <TrapCollectionView trapCollection={this.props.trapCollection}/>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Row>

  }

}


interface DistributionPossibilityViewProps {
  possibility: DistributionPossibility
}


interface DistributionPossibilityViewState {
  changeView: boolean
}


export default class DistributionPossibilityView extends React.Component<DistributionPossibilityViewProps,
  DistributionPossibilityViewState> {

  constructor(props: DistributionPossibilityViewProps) {
    super(props);
    this.state = {
      changeView: false
    };
  }

  render() {
    return <>
      <Row>
        <Button
          onClick={() => this.setState({changeView: !this.state.changeView})}
        >
          {this.state.changeView ? 'change' : 'result'}
        </Button>
      </Row>
      {
        this.state.changeView ? <>
            <CollectionWithPdf
              trapCollection={this.props.possibility.addedTraps}
              pdfUrl={this.props.possibility.addedPdfUrl}
              name='Added traps'
            />
            <CollectionWithPdf
              trapCollection={this.props.possibility.removedTraps}
              pdfUrl={this.props.possibility.removedPdfUrl}
              name='Removed'
            />
          </> :
          <CollectionWithPdf
            trapCollection={this.props.possibility.trapCollection}
            pdfUrl={this.props.possibility.pdfUrl}
            name='Distribution'
          />
      }
    </>

  }

}