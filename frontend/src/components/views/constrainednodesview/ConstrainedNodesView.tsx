import React from 'react';

import Table from "react-bootstrap/Table";
import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';

import {ConstrainedNode, ConstrainedNodes} from '../../models/models';
import {NodeListItem} from "../../utils/listitems";

import '../../../styling/ConstrainedNodesView.css';


interface ConstrainedNodesViewProps {
  constrainedNodes: ConstrainedNodes
  onNodeClick?: ((node: ConstrainedNode, multiplicity: number) => void) | null
  onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
}

export default class ConstrainedNodesView extends React.Component<ConstrainedNodesViewProps> {

  render() {
    const columns = [
      {
        dataField: 'key',
        text: 'Key',
        hidden: true,
      },
      {
        dataField: 'qty',
        text: 'Qty',
        type: 'number',
        validator: (newValue: string, row: any, column: any): any => {
          if (/^\d+$/.exec(newValue)) {
            return true
          }
          return {
            valid: false,
            message: 'Invalid number'
          }
        },
      },
      {
        dataField: 'node',
        text: 'Node',
        editable: false,
      },
      {
        dataField: 'value',
        text: 'Weight',
        type: 'number',
        validator: (newValue: string, row: any, column: any): any => {
          if (/^\d+$/.exec(newValue)) {
            return true
          }
          return {
            valid: false,
            message: 'Invalid number'
          }
        },
      },
      {
        dataField: 'groups',
        text: 'Groups',
        validator: (newValue: string, row: any, column: any): any => {
          if (/^(\w+(,\s*)?)+$/.exec(newValue)) {
            return true
          }
          return {
            valid: false,
            message: 'Invalid groups'
          }
        },
      },
    ];

    if (!this.props.onNodeEdit) {
      columns.forEach(
        column => column.editable = false
      )
    }

    const data = this.props.constrainedNodes.nodes().items.sort(
      (a, b) => b[0].value - a[0].value
    ).map(
      ([constrainedNode, multiplicity]: [ConstrainedNode, number]) => {
        return {
          qty: multiplicity,
          node: <NodeListItem
            node={constrainedNode.node()}
            onClick={(node, multiplicity) => this.props.onNodeClick(constrainedNode, multiplicity)}
          />,
          value: constrainedNode.value,
          groups: constrainedNode.groups.join(', '),
          key: constrainedNode.node().representation()
        }
      }
    );

    return <BootstrapTable
      keyField='key'
      data={data}
      columns={columns}
      condensed={true}
      bootstrap4={true}
      cellEdit={
        cellEditFactory(
          {
            mode: 'click',
            beforeSaveCell: (
              (oldValue: any, newValue: any, row: any, column: any) => {
                if (oldValue == newValue) {
                  return;
                }
                const oldNode = new ConstrainedNode(
                  row.node.props.node,
                  row.value,
                  row.groups.split(',').map(
                    (group: string) => group.replace(/^\s+/, '').replace(/\s+$/, '')
                  )
                );
                const newNode = {...oldNode};
                if (column.dataField === 'value') {
                  newNode.value = newValue
                } else if (column.dataField == 'groups') {
                  newNode.groups = newValue.split(',').map(
                    (group: string) => group.replace(/^\s+/, '').replace(/\s+$/, '')
                  )
                } else {
                  return
                }
                this.props.onNodeEdit(oldNode, newNode, row.qty);
              }
            ),
            blurToSave: true,
          }
        )
      }
    />

  }
}
