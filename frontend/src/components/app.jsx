import React from 'react';
import ReactDOM from 'react-dom';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import {get_cubes} from './utils.jsx';
import CubeList from './cubeslist.jsx';


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cubes: [],
    };
  }

  componentDidMount() {

    get_cubes().then(
      response => {
        console.log(response);
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

const dom = document.getElementById("app");
dom ? ReactDOM.render(<App/>, dom) : null;
