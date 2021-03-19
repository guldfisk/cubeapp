import React from 'react';

import {Redirect} from "react-router-dom";

import {Loading} from '../../utils/utils';
import {CubeRelease, MinimalRatingMap} from '../../models/models';


interface ReleaseRatingsPageProps {
  match: any
}


interface ReleaseRatingsPageState {
  ratingMap: null | MinimalRatingMap
}


export default class ReleaseRatingsPage extends React.Component<ReleaseRatingsPageProps, ReleaseRatingsPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      ratingMap: null,
    };
  }

  componentDidMount() {
    CubeRelease.ratingMap(this.props.match.params.id).then(
      ratingMap => {
        this.setState({ratingMap})
      }
    );
  }

  render() {
    return this.state.ratingMap ? <Redirect to={'/rating-map/' + this.state.ratingMap.id}/> : <Loading/>;
  }

}
