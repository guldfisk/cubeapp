import React from 'react';

import {CubeableImage} from '../images.jsx';


class CubeSpoilerView extends React.Component {

  render() {
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
              id={cubeable.id}
              type={cubeable.type}
              sizeSlug="medium"
            />
          }
        )
      }
    </div>

  }

}

export default CubeSpoilerView;