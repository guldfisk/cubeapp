import React from 'react';

import {
  PrintingNode,
} from "../../models/models";
import Button from "react-bootstrap/Button";
import {NodeTreeBuilder} from "./NodeTreeBuilder";


interface NodeTreeEditorProps {
  defaultValue: PrintingNode
  onUpdate: (newValue: any) => null
}


interface NodeTreeEditorState {
  currentNode: PrintingNode
}


export class NodeTreeEditor extends React.Component<NodeTreeEditorProps, NodeTreeEditorState> {

  constructor(props: NodeTreeEditorProps) {
    super(props);
    this.state = {
      currentNode: this.props.defaultValue,
    }
  }

  render() {
    return <>
      <NodeTreeBuilder
        node={this.state.currentNode}
        changed={(currentNode: PrintingNode) => this.setState({currentNode})}
      />
      <Button onClick={() => this.props.onUpdate(null)}>Cancel</Button>
      <Button onClick={() => this.props.onUpdate(this.state.currentNode)}>Save</Button>
    </>
  }

}

