import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';

import {ConstrainedNode, ConstrainedNodes, GroupMap} from '../../models/models';
import {NodeListItem} from "../../utils/listitems";


interface GroupMapViewProps {
  // constrainedNodes: ConstrainedNodes
  // onNodeClick?: ((node: ConstrainedNode, multiplicity: number) => void) | null
  // onNodeEdit?: (before: ConstrainedNode, after: ConstrainedNode, multiplicity: number) => void
  // onNodeQtyEdit?: (before: number, after: number, node: ConstrainedNode) => void
  // noHover?: boolean
  search?: boolean
  groupMap: GroupMap
  // negative?: boolean
  // onlyEditQty?: boolean
}


export default class GroupMapView extends React.Component<GroupMapViewProps> {

  render() {
    const columns = [
      {
        dataField: 'name',
        text: 'Name',
        sort: true,
      },
      {
        dataField: 'weight',
        text: 'Weight',
        sort: true,
      },

    ];

    const data = Object.entries(
      this.props.groupMap.groups
    ).sort(
      ([first_group, first_weight], [second_group, second_weight]): number => {
        return (
          first_weight > second_weight ?
            -1 :
            first_weight < second_weight ?
              1 :
              first_group > second_group ?
                1 :
                first_group < second_group ?
                  -1 :
                  0
        )
      }
    ).map(
      ([group, weight]) => {
        return {
          name: group,
          weight,
        }
      }
    );

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
              // defaultSorted={
              //   [
              //     {
              //       dataField: 'weight',
              //       order: 'desc',
              //     },
              //   ]
              // }
              pagination={
                paginationFactory(
                  {
                    hidePageListOnlyOnePage: true,
                    showTotal: true,
                    sizePerPage: 20,
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
