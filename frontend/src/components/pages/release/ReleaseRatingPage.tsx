import React from 'react';

import {Redirect} from "react-router-dom";

import {Loading, NotFound} from '../../utils/utils';
import {CubeRelease, MinimalRatingMap} from '../../models/models';


interface ReleaseRatingsPageProps {
  match: any
}


interface ReleaseRatingsPageState {
  ratingMap: null | MinimalRatingMap
  error: any
}


export default class ReleaseRatingsPage extends React.Component<ReleaseRatingsPageProps, ReleaseRatingsPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      ratingMap: null,
      error: null,
    };
  }

  componentDidMount() {
    CubeRelease.ratingMap(this.props.match.params.id).then(
      ratingMap => {
        this.setState({ratingMap})
      }
    ).catch(
      error => this.setState({error})
    );
  }

  render() {
    if (this.state.error) {
      return <NotFound/>;
    }
    return this.state.ratingMap ? <Redirect to={'/rating-map/' + this.state.ratingMap.id}/> : <Loading/>;
  }

}
