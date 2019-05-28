import React from 'react';
import ReactDOM from 'react-dom';

import {get_cubes} from './utils.jsx';


class CubeContainer extends React.Component {

  render() {
    return <div>haha</div>
  }
}

export default CubeContainer;

const dom = document.getElementById("app");
dom ? ReactDOM.render(<CubeContainer />, dom) : null;

get_cubes();