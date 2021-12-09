import React from 'react';

import {ImageableImage} from '../../images';
import {Cubeable, PickPool} from "../../models/models";


interface PickPoolSpoilerProps {
  pickPool: PickPool
  sizeSlug: string
  allowStaticImages: boolean
  imageStyle?: any
  onCubeableClicked?: null | ((cubeable: Cubeable, pickNumber: number) => void)
}


export default class PickPoolSpoiler extends React.Component<PickPoolSpoilerProps> {

  static defaultProps = {
    sizeSlug: 'thumbnail',
    allowStaticImages: true,
  };

  render() {

    return <div>
      {
        this.props.pickPool.picks.map(
          (pick, pickNumber) => pick.map(
            cubeable => {
              return <ImageableImage
                key={pickNumber}
                imageable={cubeable}
                sizeSlug={this.props.sizeSlug}
                hover={true}
                allowStatic={this.props.allowStaticImages}
                style={this.props.imageStyle}
                onClick={
                  this.props.onCubeableClicked
                  && (cubeable => this.props.onCubeableClicked(cubeable as Cubeable, pickNumber))
                }
              />
            }
          )
        )
      }
    </div>
  }
}
