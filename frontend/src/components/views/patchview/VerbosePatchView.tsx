import React from 'react';

import '../../../styling/PatchView.css';

import {ConstrainedNode, Cubeable, Patch} from '../../models/models';
import Row from "react-bootstrap/Row";
import {Col} from "react-bootstrap";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";
import ConstrainedNodesView from "../constrainednodesview/ConstrainedNodesView";


interface VerbosePatchViewProps {
  patch: Patch
  onItemClicked?: () => void
}

export default class VerbosePatchView extends React.Component<VerbosePatchViewProps, null> {

  constructor(props: VerbosePatchViewProps) {
    super(props);
  }

  render() {
    return "VerbosePatchViewProps";
  }

}
