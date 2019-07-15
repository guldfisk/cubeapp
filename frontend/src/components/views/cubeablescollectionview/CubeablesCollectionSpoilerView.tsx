import React from 'react';

import {CubeableImage} from '../../images';
import {Cubeable, RawCube} from "../../models/models";


interface RawCubeSpoilerViewProps {
  rawCube: RawCube
  cubeableType: string
}

export default class CubeablesCollectionSpoilerView extends React.Component<RawCubeSpoilerViewProps> {

  render() {
    const pictured = (
      this.props.cubeableType === 'Cubeables' ?
       this.props.rawCube.cubeables() :
       [...this.props.rawCube.allPrintings()]
    );
    return <div
      style={
        {
          display: 'flex',
          flexWrap: 'wrap',
        }
      }
    >
      {
        pictured.map(
          (cubeable: Cubeable) => {
            return <CubeableImage
              cubeable={cubeable}
              sizeSlug="thumbnail"
            />
          }
        )
      }
    </div>

  }
}
