import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';

import {ConstrainedNode, ConstrainedNodes} from '../../models/models';
import {NodeListItem} from "../../utils/listitems";


interface ConstrainedNodesViewProps {
  constrainedNodes: ConstrainedNodes
  onNodeClick?: ((node: ConstrainedNode, multiplicity: number) => void) | null
  onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
  onNodeQtyEdit?: (before: number, after: number, node: ConstrainedNode) => void
  noHover?: boolean
  search?: boolean
  negative?: boolean
  onlyEditQty?: boolean
}


export default class ConstrainedNodesView extends React.Component<ConstrainedNodesViewProps> {

  sortNodes = (a: any, b: any, order: string = 'asc') => {
    const aLow = a.props.node.representation().toLowerCase();
    const bLow = b.props.node.representation().toLowerCase();

    if (order === 'desc') {
      return aLow > bLow ? -1 : aLow < bLow ? 1 : 0;
    }
    return aLow > bLow ? 1 : aLow < bLow ? -1 : 0;
  };

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
          if (
            (this.props.negative && /^(-\d+)|(-?0)$/.exec(newValue))
            || /^\d+$/.exec(newValue)
          ) {
            return true
          }
          return {
            valid: false,
            message: 'Invalid number'
          }
        },
        sort: true,
        sortFunc: (a: number, b: number, order: string) => {
          if (order === 'desc') {
            return b - a;
          }
          return a - b;
        },
      },
      {
        dataField: 'node',
        text: 'Node',
        editable: false,
        sort: true,
        sortFunc: this.sortNodes,
        filterValue: (cell: any, row: any) => cell.props.node.representation(),
      },
      {
        dataField: 'value',
        text: 'Weight',
        type: 'number',
        editable: !this.props.onlyEditQty,
        validator: (newValue: string, row: any, column: any): any => {
          if (/^\d+$/.exec(newValue)) {
            return true
          }
          return {
            valid: false,
            message: 'Invalid number'
          }
        },
        sort: true,
        sortFunc: (a: number, b: number, order: string) => {
          if (order === 'desc') {
            return b - a;
          }
          return a - b;
        }
      },
      {
        dataField: 'groups',
        text: 'Groups',
        editable: !this.props.onlyEditQty,
        validator: (newValue: string, row: any, column: any): any => {
          if (/^(\w+(,\s*)?)*$/.exec(newValue)) {
            return true
          }
          return {
            valid: false,
            message: 'Invalid groups'
          }
        },
      },
    ];

    const data = Array.from(this.props.constrainedNodes.nodes.items()).map(
      ([constrainedNode, multiplicity]: [ConstrainedNode, number]) => {
        return {
          qty: multiplicity,
          node: <NodeListItem
            node={constrainedNode.node}
            onClick={(node, multiplicity) => this.props.onNodeClick(constrainedNode, multiplicity)}
            noHover={this.props.noHover}
          />,
          value: constrainedNode.value,
          groups: constrainedNode.groups.join(', '),
          key: constrainedNode.id,
        }
      }
    ).sort(
      (a, b) => this.sortNodes(a.node, b.node)
    );

    const {SearchBar} = Search;

    return <ToolkitProvider
      keyField='key'
      data={data}
      columns={columns}
      bootstrap4
      search
    >
      {
        (props: any) => (
          <div>
            {
              this.props.search ? <SearchBar
                {...props.searchProps}
              /> : undefined
            }
            <BootstrapTable
              {...props.baseProps}
              condensed
              striped
              defaultSorted={
                [
                  {
                    dataField: 'value',
                    order: 'desc',
                  },
                  {
                    dataField: 'node',
                    order: 'desc',
                  },
                ]
              }
              pagination={
                paginationFactory(
                  {
                    hidePageListOnlyOnePage: true,
                    showTotal: true,
                    sizePerPage: 30,
                  }
                )
              }
              cellEdit={
                !this.props.onNodeEdit ? undefined : cellEditFactory(
                  {
                    mode: 'click',
                    beforeSaveCell: (
                      (oldValue: any, newValue: any, row: any, column: any) => {
                        if (oldValue == newValue) {
                          return;
                        }
                        const oldNode = new ConstrainedNode(
                          row.node.props.id,
                          row.node.props.node,
                          row.value,
                          row.groups.split(',').map(
                            (group: string) => group.replace(/^\s+/, '').replace(/\s+$/, '')
                          ).filter(
                            (s: string) => s.length > 0
                          )
                        );
                        if (column.dataField === 'qty') {
                          this.props.onNodeQtyEdit(oldValue, newValue, oldNode);
                          return;
                        }
                        const newNode = new ConstrainedNode(
                          row.node.props.id,
                          oldNode.node,
                          oldNode.value,
                          oldNode.groups,
                        );
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
          </div>
        )
      }
    </ToolkitProvider>
  }
}
