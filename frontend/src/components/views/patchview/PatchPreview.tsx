import React from 'react'
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";
import {Cardboard, ConstrainedNode, Cubeable, Preview} from "../../models/models";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import ConstrainedNodesView from "../constrainednodesview/ConstrainedNodesView";
import GroupMapView from "../groupmap/GroupMapView";
import InfinitesView from "../infinites/InfinitesView";


interface PatchPreviewProps {
  preview: Preview
  onCubeablesClicked?: (cubeable: Cubeable, amount: number) => void
  onNodeClicked?: (node: ConstrainedNode, multiplicity: number) => void
  onNodeRemove?: (node: ConstrainedNode, multiplicity: number) => void
  onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
  onNodeQtyEdit?: (before: number, after: number, node: ConstrainedNode) => void
  onGroupClicked?: (group: string, weight: number) => void
  onGroupEdit?: (group: string, weightBefore: number, weightAfter: number) => void
  onInfiniteClicked?: ((cardboard: Cardboard) => void) | null
  noHover: boolean
}


export default class PatchPreview extends React.Component<PatchPreviewProps> {

  public static defaultProps = {
    noHover: false,
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
              onNodeRemove={this.props.onNodeRemove}
              onNodeEdit={this.props.onNodeEdit}
              onNodeQtyEdit={this.props.onNodeQtyEdit}
              search
            />
          </Tab>
          <Tab eventKey='groups' title='Groups'>
            <GroupMapView
              groupMap={this.props.preview.groupMap}
              onGroupClicked={this.props.onGroupClicked}
              onGroupEdit={this.props.onGroupEdit}
              search
            />
          </Tab>
          <Tab eventKey='infinites' title='Infinites'>
            <InfinitesView
              infinites={this.props.preview.infinites}
              onCardboardClick={this.props.onInfiniteClicked}
            />
          </Tab>
        </Tabs>

      </Card.Body>
    </Card>
  }

}