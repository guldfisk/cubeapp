import React from 'react';

import {CubeableImage} from '../../images';
import {Cubeable, RawCube} from "../../models/models";


interface RawCubeSpoilerViewProps {
  rawCube: RawCube
  cubeableType: string
}

export default class RawCubeSpoilerView extends React.Component<RawCubeSpoilerViewProps> {

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
              id={cubeable.id()}
              type={cubeable.type()}
              sizeSlug="medium"
            />
          }
        )
      }
    </div>

  }
}
