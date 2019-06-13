import React from 'react';
import ReactDOM from 'react-dom';

import {get_cubes, get_cube} from './utils.jsx';
import CubeModel from './cubemodel.js'
import CubeMultiView from './CubeMultiView.jsx'

import Bootstrap from 'bootstrap/dist/css/bootstrap.min.css';



class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  componentDidMount() {
    get_cube(this.props.cubeId).then(
      response => {
        this.setState(
          {
            cube: new CubeModel(response.data),
          }
        )
      }
    )
  }

  render() {

    return <CubeMultiView
      cube={this.state.cube}
    />
  }

}

const dom = document.getElementById("app");
dom ? ReactDOM.render(<App cubeId={dom.dataset["key"]}/>, dom) : null;
