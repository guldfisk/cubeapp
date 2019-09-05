import React from 'react'
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";
import {ConstrainedNode, Cubeable, Preview} from "../../models/models";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import ConstrainedNodesView from "../constrainednodesview/ConstrainedNodesView";
import GroupMapView from "../groupmap/GroupMapView";


interface PatchPreviewProps {
  preview: Preview
  onCubeablesClicked?: (cubeable: Cubeable, amount: number) => void
  onNodeClicked?: (node: ConstrainedNode, multiplicity: number) => void
  onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
  onNodeQtyEdit?: (before: number, after: number, node: ConstrainedNode) => void
  noHover: boolean
}

export default class PatchPreview extends React.Component<PatchPreviewProps> {

  public static defaultProps = {
    noHover: true,
  };

  render() {
    return <Card>
      <Card.Header>
        <Row>
          Preview
          <span className="badge badge-secondary ml-auto">
              {
                `${
                  Array.from(
                    this.props.preview.cubeables.allCubeables()
                  ).length
                  }/${
                  360
                  }`
              }
            </span>
        </Row>
      </Card.Header>
      <Card.Body>
        <Tabs
          id='preview-tabs'
          defaultActiveKey='cube'
          mountOnEnter={true}
          unmountOnExit={false}
        >
          <Tab eventKey='cube' title='Cube' transition={false}>
            <CubeablesCollectionListView
              cubeableType="Cubeables"
              rawCube={this.props.preview.cubeables}
              onCubeableClicked={this.props.onCubeablesClicked}
              noHover={this.props.noHover}
              noGarbage={true}
            />
          </Tab>
          <Tab eventKey='nodes' title='Nodes'>
            <ConstrainedNodesView
              constrainedNodes={this.props.preview.constrainedNodes}
              onNodeClick={this.props.onNodeClicked}
              onNodeEdit={this.props.onNodeEdit}
              onNodeQtyEdit={this.props.onNodeQtyEdit}
              search
            />
          </Tab>
          <Tab eventKey='groups' title='Groups'>
            <GroupMapView
              groupMap={this.props.preview.groupMap}
              search
            />
          </Tab>
        </Tabs>

      </Card.Body>
    </Card>
  }

}