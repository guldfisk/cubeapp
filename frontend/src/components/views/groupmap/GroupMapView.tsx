import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';

import {GroupMap} from '../../models/models';


const columnFormatterMetaFactory = (onGroupClicked?: (group: string, weight: number) => void) => {
  return (cell: any, row: any, rowIndex: number, formatExtraData: any) => {
    return <span
      onClick={!onGroupClicked ? undefined : () => onGroupClicked(row.name, row.weight)}
    >
      {cell}
    </span>
  };
};


interface GroupMapViewProps {
  onGroupClicked?: (group: string, weight: number) => void
  onGroupEdit?: (group: string, weightBefore: number, weightAfter: number) => void
  search?: boolean
  groupMap: GroupMap
}


export default class GroupMapView extends React.Component<GroupMapViewProps> {

  render() {
    const columns = [
      {
        dataField: 'name',
        text: 'Name',
        formatter: columnFormatterMetaFactory(this.props.onGroupClicked),
        sort: true,
        editable: false,
      },
      {
        dataField: 'weight',
        text: 'Weight',
        type: 'number',
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
              pagination={
                paginationFactory(
                  {
                    hidePageListOnlyOnePage: true,
                    showTotal: true,
                    sizePerPage: 20,
                  }
                )
              }
              cellEdit={
                !this.props.onGroupEdit ? undefined : cellEditFactory(
                  {
                    mode: 'click',
                    beforeSaveCell: (
                      (oldValue: any, newValue: any, row: any, column: any) => {
                        if (oldValue == newValue) {
                          return;
                        }
                        this.props.onGroupEdit(row.name, oldValue, newValue);
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
