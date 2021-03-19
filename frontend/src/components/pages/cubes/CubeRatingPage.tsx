import React from 'react';

import {Redirect} from "react-router-dom";

import {Loading} from '../../utils/utils';
import {Cube, MinimalRatingMap} from '../../models/models';


interface CubeRatingsPageProps {
  match: any
}


interface CubeRatingsPageState {
  ratingMap: null | MinimalRatingMap
}


export default class CubeRatingsPage extends React.Component<CubeRatingsPageProps, CubeRatingsPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      ratingMap: null,
    };
  }

  componentDidMount() {
    Cube.ratingMap(this.props.match.params.id).then(
      ratingMap => {
        this.setState({ratingMap})
      }
    );
  }

  render() {
    return this.state.ratingMap ? <Redirect to={'/rating-map/' + this.state.ratingMap.id}/> : <Loading/>;
  }

}
