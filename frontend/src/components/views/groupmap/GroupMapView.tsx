import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';

import {ConstrainedNode, ConstrainedNodes} from '../../models/models';
import {NodeListItem} from "../../utils/listitems";


interface GroupMapViewProps {
  // constrainedNodes: ConstrainedNodes
  // onNodeClick?: ((node: ConstrainedNode, multiplicity: number) => void) | null
  // onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
  // onNodeQtyEdit?: (before: number, after: number, node: ConstrainedNode) => void
  // noHover?: boolean
  search?: boolean
  // negative?: boolean
  // onlyEditQty?: boolean
}


export default class GroupMapView extends React.Component<GroupMapViewProps> {

  render() {
    const columns = [
      {
        dataField: 'name',
        text: 'Name',
      },
      {
        dataField: 'weight',
        text: 'Weight',
      },

    ];

    const data = [
      {
        name: 'ok',
        weight: 2,
      }
    ];

    const {SearchBar} = Search;

    return <ToolkitProvider
      keyField='name'
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
                    dataField: 'name',
                    order: 'asc',
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
            />
          </div>
        )
      }
    </ToolkitProvider>
  }
}
