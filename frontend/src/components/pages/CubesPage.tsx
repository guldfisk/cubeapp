import React from 'react';

import {Cube} from '../models/models';

import CubesView from '../views/cubeview/CubesView';


interface CubesPageState {
  cubes: Cube[]
}

class CubesPage extends React.Component<null, CubesPageState> {

  constructor(props: null) {
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

  }

  render() {
    return <CubesView
      cubes={this.state.cubes}
    />
  }

}

export default CubesPage;