import React from 'react';

import {ConstrainedNode, Cubeable, Patch, VerbosePatch} from '../../models/models';
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import PatchView from "./PatchView";
import VerbosePatchView from "./VerbosePatchView";


interface PatchMultiViewProps {
  patch: Patch
  verbosePatch?: VerbosePatch;
  onItemClicked?: (item: Cubeable | ConstrainedNode, amount: number) => void
  onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
}

export default class PatchMultiView extends React.Component<PatchMultiViewProps> {

  constructor(props: PatchMultiViewProps) {
    super(props);
    this.state = {
      verbosePatch: null,
    }
  }

  render() {
    return <Tabs
      id={'patch-multi-view'}
      defaultActiveKey="raw"
      mountOnEnter={true}
      unmountOnExit={false}
    >
      <hr/>
      <Tab
        eventKey="raw"
        title="Raw"
      >
        <PatchView
          patch={this.props.patch}
          onItemClicked={this.props.onItemClicked}
          onNodeEdit={this.props.onNodeEdit}
        />
      </Tab>
      <Tab
        eventKey="verbose"
        title="Verbose"
        disabled={!this.props.verbosePatch}
      >
        <VerbosePatchView
          patch={this.props.verbosePatch}
        />
      </Tab>
    </Tabs>
  }

}
