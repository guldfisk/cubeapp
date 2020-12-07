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
  onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
  onNodeQtyEdit?: (before: number, after: number, node: ConstrainedNode) => void
}


export default class PatchView extends React.Component<DeltaViewProps, null> {

  constructor(props: DeltaViewProps) {
    super(props);
  }

  render() {
    return <div>
      <Row>
        <Col>
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
        </Col>
        <Col>
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
        </Col>
      </Row>
      <Row>
        <Col>
          <ConstrainedNodesView
            constrainedNodes={this.props.patch.positiveConstrainedNodes}
            onNodeClick={
              (node) => this.props.onItemClicked(node, -1)
            }
            onNodeEdit={this.props.onNodeEdit}
            onNodeQtyEdit={this.props.onNodeQtyEdit}
            search
          />
        </Col>
        <Col>
          <ConstrainedNodesView
            constrainedNodes={this.props.patch.negativeConstrainedNodes}
            onNodeClick={
              (node) => this.props.onItemClicked(node, 1)
            }
            onNodeEdit={this.props.onNodeEdit}
            onNodeQtyEdit={this.props.onNodeQtyEdit}
            negative
            onlyEditQty
            search
          />
        </Col>
      </Row>
    </div>
  }

}
