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
    console.log(this.props);
    console.log(this.props.match.params.cubeId);
  }

  componentDidMount() {
    get_cube(this.props.match.params.cubeId).then(
      response => {
        console.log(response.data);
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
      fluid={true}
    />
  }

}

export default CubeViewPage;