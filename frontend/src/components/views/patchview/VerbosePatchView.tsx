import React from 'react';

import {ConstrainedNode, Cubeable, CubeChange, Patch, VerbosePatch} from '../../models/models';
import Row from "react-bootstrap/Row";
import {Col} from "react-bootstrap";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";
import ConstrainedNodesView from "../constrainednodesview/ConstrainedNodesView";
import ListGroup from "react-bootstrap/ListGroup";

import wu from 'wu'

import {CubeChangeListItem} from "../../utils/listitems";
import Container from "react-bootstrap/Container";


interface VerbosePatchViewProps {
  patch: VerbosePatch
  onChangeClicked?: (change: CubeChange, multiplicity: number) => void
}

export default class VerbosePatchView extends React.Component<VerbosePatchViewProps, null> {

  private static colorMap: { [k: string]: string } = {
    addition: 'green',
    subtraction: 'red',
    modification: 'blue',
    transfer: 'yellow',
  };

  constructor(props: VerbosePatchViewProps) {
    super(props);
  }

  render() {
    const groups: { [k: string]: [string, [CubeChange, number][]] } = {};
    wu(this.props.patch.changes.items()).forEach(
      ([change, multiplicity]) => {
        if (groups[change.type] === undefined) {
          groups[change.type] = [change.category, []]
        }
        groups[change.type][1].push([change, multiplicity]);
      }
    );

    return <Container fluid>
      <Row>
        {
          Object.entries(groups).map(
            ([type, [category, group]]) => {
              return <Col>
                <ListGroup
                  variant="flush"
                >
                  <ListGroup.Item
                    style={{color: VerbosePatchView.colorMap[category]}}
                  >
                    {type.replace(/([a-z])([A-Z])/g, '$1 $2') + ' ' + group.length}
                  </ListGroup.Item>
                  {
                    group.map(
                      ([change, multiplicity]) => <CubeChangeListItem
                        change={change}
                        multiplicity={multiplicity}
                        onClick={this.props.onChangeClicked}
                      />
                    )
                  }
                </ListGroup>
              </Col>
            }
          )
        }
      </Row>
    </Container>;
  }

}
