import React from 'react';

import {ConstrainedNode, Cubeable, Patch, VerbosePatch} from '../../models/models';
import Row from "react-bootstrap/Row";
import {Col} from "react-bootstrap";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";
import ConstrainedNodesView from "../constrainednodesview/ConstrainedNodesView";
import ListGroup from "react-bootstrap/ListGroup";


interface VerbosePatchViewProps {
  patch: VerbosePatch
  onItemClicked?: () => void
}

export default class VerbosePatchView extends React.Component<VerbosePatchViewProps, null> {

  constructor(props: VerbosePatchViewProps) {
    super(props);
  }

  render() {
    return <ListGroup
      variant="flush"
    >
      {
        this.props.patch.changes.items.map(
          ([change, multiplicity]) => <ListGroup.Item
            key={change.id}
          >
            {change.explanation}
          </ListGroup.Item>
        )
      }
    </ListGroup>
  }

}
