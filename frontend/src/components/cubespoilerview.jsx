import React from 'react';

import {get_cubeable_images_url} from './utils.jsx';


class CubeableImage extends React.Component {
  render() {
    return <img
      src={get_cubeable_images_url(this.props.cubeable.id, this.props.cubeable.type)}
      width="370px"
      alt={this.props.cubeable.id}
    />
  }
}

class CubeSpoilerView extends React.Component {

  render() {
    console.log(this.props);
    return <div
      style={
        {
          display: 'flex',
          flexWrap: 'wrap',
        }
      }
    >
      {
        this.props.cube.cubeables().map(
          cubeable => {
            return <CubeableImage
              cubeable={cubeable}
            />
          }
        )
      }
    </div>

  }

}

export default CubeSpoilerView;