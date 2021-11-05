import React from 'react';

import {Link} from "react-router-dom";
import BootstrapTable from 'react-bootstrap-table-next';

import {Cube, CubeReleaseMeta, User} from "../../models/models";
import {DateListItem} from "../../utils/listitems";


interface CubesViewProps {
  cubes: Cube[]
}

export default class CubesView extends React.Component<CubesViewProps> {

  render() {

    const columns = [
      {
        dataField: 'id',
        text: 'Key',
        hidden: true,
      },
      {
        dataField: 'name',
        text: 'Name',
        formatter: (cell: string, row: Cube) => <Link to={`/cube/${row.id}`}>
          {cell}
        </Link>,
      },
      {
        dataField: 'description',
        text: 'Description',
      },
      {
        dataField: 'author',
        text: 'Author',
        formatter: (cell: User) => cell.username,
      },
      {
        dataField: 'id',
        text: 'Latest Release',
        formatter: (cell: any, row: Cube) => row.latestRelease() !== null ?
          <Link to={`/release/${row.latestRelease().id}`}>
            {row.latestRelease().name}
          </Link> : "No releases",
      },
      {
        dataField: 'id',
        text: 'Latest Patch',
        formatter: (cell: string | number) => (
          <Link to={`/cube/${cell}/latest-patch/`}>
            patch
          </Link>
        )
      },
      {
        dataField: 'id',
        text: 'Last Update',
        formatter: (cell: any, row: Cube) => row.latestRelease() !== null ?
          <DateListItem
            date={row.latestRelease().createdAt}
          /> : "No releases",
      },
      {
        dataField: 'releases',
        text: 'Releases',
        formatter: (cell: CubeReleaseMeta[]) => cell.length,
      },
      {
        dataField: 'createdAt',
        text: 'Created At',
        formatter: (cell: Date) => <DateListItem
          date={cell}
        />,
      },

    ];

    return <BootstrapTable
      keyField='id'
      columns={columns}
      data={this.props.cubes}
      condensed
      striped
    />
  }

}
