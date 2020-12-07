import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';

import {CubeReleaseMeta} from '../../models/models';
import {DateListItem} from "../../utils/listitems";


interface GroupMapViewProps {
  releases: CubeReleaseMeta[]
  onReleaseClicked?: (release: CubeReleaseMeta) => void
}


export default class ReleasesView extends React.Component<GroupMapViewProps> {

  render() {
    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'name',
        text: 'Name',
      },
      {
        dataField: 'createdAt',
        text: 'Release Date',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <DateListItem date={cell}/>,
      },

    ];

    const data = this.props.releases.sort(
      (a, b) => a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0
    );

    return <BootstrapTable
      keyField='id'
      data={data}
      columns={columns}
      bootstrap4
      condensed
      striped
      pagination={
        paginationFactory(
          {
            hidePageListOnlyOnePage: true,
            showTotal: true,
            sizePerPage: 10,
          }
        )
      }
      selectRow={
        !this.props.onReleaseClicked ? undefined : {
          mode: 'radio',
          onSelect: (row: any, isSelect: any, rowIndex: number, e: any) => {
            if (isSelect) {
              this.props.onReleaseClicked(row)
            }
          },
          hideSelectAll: true,
        }
      }
    />
  }

}
