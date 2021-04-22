import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';

import {ConstrainedNode, ConstrainedNodes} from '../../models/models';
import {NodeListItem} from "../../utils/listitems";
import {NodeTreeEditor} from "../nodes/NodeTreeEditor";


interface ConstrainedNodesViewProps {
  constrainedNodes: ConstrainedNodes
  onNodeClick?: (node: ConstrainedNode, multiplicity: number) => void
  onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
  onNodeRemove?: (node: ConstrainedNode, multiplicity: number) => void
  onNodeQtyEdit?: (before: number, after: number, node: ConstrainedNode) => void
  noHover?: boolean
  search?: boolean
  negative?: boolean
  onlyEditQty?: boolean
}


export default class ConstrainedNodesView extends React.Component<ConstrainedNodesViewProps> {

  sortNodes = (a: ConstrainedNode, b: ConstrainedNode, order: string = 'asc') => {
    const aLow = a.node.representation().toLowerCase();
    const bLow = b.node.representation().toLowerCase();

    if (order === 'desc') {
      return aLow > bLow ? -1 : aLow < bLow ? 1 : 0;
    }
    return aLow > bLow ? 1 : aLow < bLow ? -1 : 0;
  };

  render() {
    const columns = [
      {
        dataField: 'id',
        text: 'Key',
        hidden: true,
      },
      {
        dataField: 'multiplicity',
        text: 'Qty',
        type: 'number',
        validator: (newValue: string, row: any, column: any): any => {
          if (
            (this.props.negative && /^(-\d+)|(-?0)$/.exec(newValue))
            || (!this.props.negative && /^\d+$/.exec(newValue))
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
        headerStyle: () => {
          return {width: '6em', textAlign: 'center'};
        },
      },
      {
        dataField: 'constrainedNode',
        text: 'Node',
        editable: !this.props.onlyEditQty,
        formatter: (cell: ConstrainedNode, row: any) => <NodeListItem
          node={cell.node}
          onClick={
            this.props.onlyEditQty ? () => this.props.onNodeClick(cell, row.multiplicity) : null
          }
          noHover={this.props.noHover}
        />,
        editorRenderer: (editorProps: any, value: ConstrainedNode, row: any) => <NodeTreeEditor
          {...editorProps}
          defaultValue={value.node}
        />,
        sort: true,
        sortFunc: this.sortNodes,
        filterValue: (cell: ConstrainedNode, row: any) => cell.node.representation(),
      },
      {
        dataField: 'weight',
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
        },
        headerStyle: () => {
          return {width: '6em', textAlign: 'center'};
        },
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
          constrainedNode,
          multiplicity,
          id: constrainedNode.id,
          weight: constrainedNode.value,
          groups: constrainedNode.groups.join(', '),
        }
      }
    ).sort(
      (a, b) => this.sortNodes(a.constrainedNode, b.constrainedNode)
    );

    const {SearchBar} = Search;

    return <div>
      <ToolkitProvider
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
                this.props.search && <SearchBar
                  {...props.searchProps}
                />
              }
              <BootstrapTable
                {...props.baseProps}
                condensed
                striped
                remote={{edit: !!this.props.onNodeEdit}}
                defaultSorted={
                  [
                    {
                      dataField: 'weight',
                      order: 'desc',
                    },
                    // {
                    //   dataField: 'node',
                    //   order: 'desc',
                    // },
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
                  !this.props.onNodeEdit ? false : cellEditFactory(
                    {
                      mode: 'click',
                      blurToSave: true,
                      beforeSaveCell: (
                        (
                          oldValue: any,
                          newValue: any,
                          row: { constrainedNode: ConstrainedNode, multiplicity: number },
                          column: any,
                        ) => {
                          if (oldValue == newValue || newValue === null) {
                            return;
                          }
                          if (column.dataField === 'multiplicity') {
                            this.props.onNodeQtyEdit(oldValue, newValue, row.constrainedNode);
                            return;
                          }
                          const newNode = new ConstrainedNode(
                            row.constrainedNode.id,
                            row.constrainedNode.node,
                            row.constrainedNode.value,
                            row.constrainedNode.groups,
                          );
                          if (column.dataField === 'weight') {
                            newNode.value = newValue;
                          } else if (column.dataField == 'groups') {
                            newNode.groups = newValue.split(',').map(
                              (group: string) => group.replace(/^\s+/, '').replace(/\s+$/, '')
                            );
                          } else if (column.dataField == 'constrainedNode') {
                            if (!newValue.children.items.length) {
                              if (this.props.onNodeRemove) {
                                this.props.onNodeRemove(row.constrainedNode, row.multiplicity)
                              }
                              return;
                            }
                            newNode.node = newValue;
                          } else {
                            return;
                          }
                          this.props.onNodeEdit(row.constrainedNode, newNode, row.multiplicity);
                        }
                      ),
                    }
                  )
                }
              />
            </div>
          )
        }
      </ToolkitProvider>
    </div>
  }
}
