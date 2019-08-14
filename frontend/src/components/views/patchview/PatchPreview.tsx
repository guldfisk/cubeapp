import React from 'react'
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";
import {ConstrainedNode, Cubeable, Preview} from "../../models/models";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import ConstrainedNodesView from "../constrainednodesview/ConstrainedNodesView";


interface PatchPreviewProps {
  preview: Preview
  onCubeablesClicked?: (cubeable: Cubeable, amount: number) => void
  onNodeClicked?: (node: ConstrainedNode, multiplicity: number) => void
  onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
  hover: boolean
}

export default class PatchPreview extends React.Component<PatchPreviewProps> {

  public static defaultProps = {
    hover: false,
  };

  render() {
    console.log('on node edit', this.props.onNodeEdit);
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
        >
          <Tab eventKey='cube' title='Cube'>
            <CubeablesCollectionListView
              cubeableType="Cubeables"
              rawCube={this.props.preview.cubeables}
              onCubeableClicked={this.props.onCubeablesClicked}
              noHover={true}
            />
          </Tab>
          <Tab eventKey='nodes' title='Nodes'>
            <ConstrainedNodesView
              constrainedNodes={this.props.preview.constrainedNodes}
              onNodeClick={this.props.onNodeClicked}
              // onNodeEdit={this.props.onNodeEdit}
              onNodeEdit={undefined}
            />
          </Tab>
        </Tabs>

      </Card.Body>
    </Card>
  }

}