import React from 'react';

import {Loading} from '../../utils/utils';
import {Cube, RatingMap} from '../../models/models';
import RatingMapView from "../../views/rating/RatingMapView";


interface CubePageProps {
  match: any
}


interface CubePageState {
  cube: null | Cube
  ratingMap: RatingMap | null
}


export default class CubePage extends React.Component<CubePageProps, CubePageState> {

  constructor(props: CubePageProps) {
    super(props);
    this.state = {
      cube: null,
      ratingMap: null,
    };
  }

  componentDidMount() {
    Cube.get(this.props.match.params.id).then(
      cube => {
        this.setState(
          {cube},
        )
      }
    );
    Cube.ratingMap(this.props.match.params.id).then(
      ratingMap => {
        this.setState(
          {ratingMap},
        )
      }
    );
  }

  render() {
    if (this.state.ratingMap === null) {
      return <Loading/>
    }
    return <RatingMapView
      ratingMap={this.state.ratingMap}
    />
  }

}
