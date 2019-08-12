import React from 'react';

import '../../../styling/PatchView.css';

import {PrintingListItem} from "../../utils/listitems";
import {Cubeable, Patch, Printing} from '../../models/models';
import Row from "react-bootstrap/Row";
import {Col} from "react-bootstrap";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";


interface DeltaViewProps {
  patch: Patch
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
}

class PatchView extends React.Component<DeltaViewProps, null> {

  constructor(props: DeltaViewProps) {
    super(props);
  }

  render() {

    return <Row>
      <Col>
        <span className="add-view">
          <CubeablesCollectionListView
            rawCube={this.props.patch.positiveCubeablesContainer}
            cubeableType={"Cubeables"}
            onCubeableClicked={
              this.props.onCubeableClicked && (
                (cubeable) => {
                  this.props.onCubeableClicked(cubeable, -1);
                }
              )
            }
          />
        </span>
      </Col>
      <Col>
        <span className="remove-view">
        <CubeablesCollectionListView
          rawCube={this.props.patch.negativeCubeablesContainer}
          cubeableType={"Cubeables"}
          onCubeableClicked={
            this.props.onCubeableClicked && (
              (cubeable) => {
                this.props.onCubeableClicked(cubeable, 1);
              }
            )
          }
        />
        </span>
      </Col>
    </Row>
  }

}

export default PatchView;