import React from 'react';

import Table from "react-bootstrap/Table";

import {ConstrainedNodes} from '../../models/models';


interface ConstrainedNodesViewProps {
  constrainedNodes: ConstrainedNodes
}

export default class ConstrainedNodesView extends React.Component<ConstrainedNodesViewProps> {

  render() {

    return <Table>
      <thead>
      <tr>
        <th>Node</th>
        <th>Value</th>
        <th>Groups</th>
      </tr>
      </thead>
      <tbody>
      {
        this.props.constrainedNodes.nodes().sort(
          (a, b) => b.value() - a.value()
        ).map(
          constrainedNode => {
            return <tr>
              <td>{constrainedNode.node().representation()}</td>
              <td>{constrainedNode.value()}</td>
              <td>{constrainedNode.groups().join(", ")}</td>
            </tr>
          }
        )
      }
      </tbody>
    </Table>

  }
}
