import axios from 'axios';
import React from 'react';

import {Cube} from '../models/models.js';
import {get_api_path} from '../utils';

import CubesView from '../views/cubeview/CubesView.jsx';


class CubesPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cubes: [],
    };
  }

  componentDidMount() {

    Cube.all().then(
      cubes => {
        this.setState(
          {
            cubes
          }
        )
      }
    );

    // axios.get(get_api_path() + 'versioned-cubes/').then(
    //   response => {
    //     this.setState(
    //       {
    //         cubes: response.data.results.map(
    //           cube => new Cube(cube)
    //         )
    //       }
    //     );
    //   }
    // )

  }

  render() {
    return <CubesView
      cubes={this.state.cubes}
    />
  }

}

export default CubesPage;