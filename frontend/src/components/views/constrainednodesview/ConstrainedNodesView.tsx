import React from 'react';

import Table from "react-bootstrap/Table";

import {ConstrainedNode, ConstrainedNodes} from '../../models/models';
import {NodeListItem} from "../../utils/listitems";

import '../../../styling/ConstrainedNodesView.css';


interface ConstrainedNodesViewProps {
  constrainedNodes: ConstrainedNodes
  onNodeClick?: ((node: ConstrainedNode, multiplicity: number) => void) | null
}

export default class ConstrainedNodesView extends React.Component<ConstrainedNodesViewProps> {

  render() {
    return <Table
      size="sm"
    >
      <thead>
      <tr>
        <th>Qty</th>
        <th>Node</th>
        <th>Value</th>
        <th>Groups</th>
      </tr>
      </thead>
      <tbody>
      {
        this.props.constrainedNodes.nodes().items.sort(
          (a, b) => b[0].value - a[0].value
        ).map(
          ([constrainedNode, multiplicity]: [ConstrainedNode, number]) => {
            return <tr>
              <td>{multiplicity}</td>
              <td>
                <NodeListItem
                  node={constrainedNode.node()}
                  onClick={(node, multiplicity) => this.props.onNodeClick(constrainedNode, multiplicity)}
                />
              </td>
              <td>{constrainedNode.value}</td>
              <td>{constrainedNode.groups.join(", ")}</td>
            </tr>
          }
        )
      }
      </tbody>
    </Table>

  }
}
