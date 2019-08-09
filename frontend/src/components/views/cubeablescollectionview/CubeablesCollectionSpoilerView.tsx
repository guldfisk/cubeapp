import wu from 'wu';

import React from 'react';

import {CubeableImage} from '../../images';
import {CubeablesContainer} from "../../models/models";


interface RawCubeSpoilerViewProps {
  cubeablesContainer: CubeablesContainer
  cubeableType: string
}

export default class CubeablesCollectionSpoilerView extends React.Component<RawCubeSpoilerViewProps> {

  render() {
    const pictured = (
      this.props.cubeableType === 'Cubeables' ?
       this.props.cubeablesContainer.allCubeables() :
        this.props.cubeablesContainer.allPrintings()
    );
    return <div
      // style={
      //   {
      //     display: 'flex',
      //     flexWrap: 'wrap',
      //   }
      // }
    >
      {
        wu(pictured).map(
          (cubeable) => {
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
