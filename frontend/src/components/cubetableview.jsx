import React from 'react';
import ReactDOM from 'react-dom';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import {get_cubes} from './utils.jsx';


class CubeTableView extends React.Component {

  green_cards = () => {
    return this.state._cube.printings.filter(
      printing => printing.colors.include('G')
    )
  };

  render() {
    const columns = [
        {
          Header: 'Name',
          accessor: 'name',
        },
        {
          Header: 'Created At',
          accessor: 'created_at',
        },
    ];

    return <ReactTable
      data={this.state.cubes}
      columns={columns}
    />

  }

}
