import React from 'react';

import {CubeableImage} from '../../images';
import {Cubeable, CubeRelease} from "../../models/models";


interface ReleaseSpoilerViewProps {
  release: CubeRelease
}

class ReleaseSpoilerView extends React.Component<ReleaseSpoilerViewProps> {

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
        this.props.release.cubeables().map(
          (cubeable: Cubeable) => {
            return <CubeableImage
              id={cubeable.id()}
              type={cubeable.type()}
              sizeSlug="small"
            />
          }
        )
      }
    </div>

  }

}

export default ReleaseSpoilerView;