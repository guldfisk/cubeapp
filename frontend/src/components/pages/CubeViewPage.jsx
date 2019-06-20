import React from 'react';

import {get_cube} from '../utils.jsx';
import CubeModel from '../cubemodel.js'
import CubeMultiView from '../CubeMultiView.jsx'


class CubeViewPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  componentDidMount() {
    get_cube(this.props.match.params.cubeId).then(
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

export default CubeViewPage;