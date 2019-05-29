import React from 'react';
import ReactDOM from 'react-dom';


import {get_cubes, get_cube} from './utils.jsx';
import CubeSpoilerView from './cubespoilerview.jsx';


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  componentDidMount() {

    get_cubes().then(
      response => {
        let cube = response.data[0];
        get_cube(cube.id).then(
          response => {
            this.setState(
              {
                cube: response.data,
              }
            )
          }
        )
      }
    )

  }

  render() {

    return this.state.cube === null ?
      <div/>
      : <CubeSpoilerView
        cube={this.state.cube}
      />

  }

}

const dom = document.getElementById("app");
dom ? ReactDOM.render(<App/>, dom) : null;
