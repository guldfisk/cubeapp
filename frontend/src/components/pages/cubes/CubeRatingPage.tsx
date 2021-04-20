import React from 'react';

import {Redirect} from "react-router-dom";

import {Loading, NotFound} from '../../utils/utils';
import {Cube, MinimalRatingMap} from '../../models/models';


interface CubeRatingsPageProps {
  match: any
}


interface CubeRatingsPageState {
  ratingMap: null | MinimalRatingMap
  error: any
}


export default class CubeRatingsPage extends React.Component<CubeRatingsPageProps, CubeRatingsPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      ratingMap: null,
      error: null,
    };
  }

  componentDidMount() {
    Cube.ratingMap(this.props.match.params.id).then(
      ratingMap => {
        this.setState({ratingMap})
      }
    ).catch(error => this.setState({error}));
  }

  render() {
    if (this.state.error) {
      return <NotFound/>
    }
    return this.state.ratingMap ? <Redirect to={'/rating-map/' + this.state.ratingMap.id}/> : <Loading/>;
  }

}
