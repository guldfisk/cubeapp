import React from 'react';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import {get_cubes} from './utils.jsx';


class CubesPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cubes: [],
    };
  }

  componentDidMount() {

    get_cubes().then(
      response => {
        this.setState(
          {
            cubes: response.data
          }
        );
      }
    )

  }

  render() {
    const columns = [
        {
          Header: 'Name',
          accessor: 'name',
          Cell: props =>
          {
            return <span
              className='number'
            >
              <a
                href={window.location.pathname + 'cubeview/' + props.original.id}
              >
                {props.value}
              </a>
            </span>;
          },
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

export default CubesPage