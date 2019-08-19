import React from 'react';

import '../../../styling/PatchView.css';

import {ConstrainedNode, Cubeable, Patch} from '../../models/models';
import Row from "react-bootstrap/Row";
import {Col} from "react-bootstrap";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";
import ConstrainedNodesView from "../constrainednodesview/ConstrainedNodesView";


interface DeltaViewProps {
  patch: Patch
  onItemClicked?: (item: Cubeable | ConstrainedNode, amount: number) => void
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
              this.props.onItemClicked && (
                (cubeable) => {
                  this.props.onItemClicked(cubeable, -1);
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
            this.props.onItemClicked && (
              (cubeable) => {
                this.props.onItemClicked(cubeable, 1);
              }
            )
          }
        />
        </span>
      </Col>
      <Col>
        <span className="add-view">
        <ConstrainedNodesView
          constrainedNodes={this.props.patch.positiveConstrainedNodes}
          onNodeClick={
              (node) => this.props.onItemClicked(node, -1)
          }
        />
        </span>
      </Col>
      <Col>
        <span className="remove-view">
        <ConstrainedNodesView
          constrainedNodes={this.props.patch.negativeConstrainedNodes}
          onNodeClick={
              (node) => this.props.onItemClicked(node, 1)
          }
        />
        </span>
      </Col>
    </Row>
  }

}

export default PatchView;