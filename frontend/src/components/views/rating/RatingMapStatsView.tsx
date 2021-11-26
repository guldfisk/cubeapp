import React from 'react';

import {Loading, NotFound} from '../../utils/utils';
import {MinimalRatingMap, StatMap} from '../../models/models';
import StatMapView from "./StatMapView";


interface RatingMapStatsViewProps {
  ratingMap: MinimalRatingMap
}


interface RatingMapStatsViewState {
  statMap: StatMap | null
  error: any
}


export default class RatingMapStatsView extends React.Component<RatingMapStatsViewProps, RatingMapStatsViewState> {

  constructor(props: RatingMapStatsViewProps) {
    super(props);
    this.state = {
      statMap: null,
      error: null,
    };
  }

  componentDidMount() {
    StatMap.get(this.props.ratingMap.id).then(
      statMap => {
        this.setState(
          {statMap},
        )
      }
    ).catch(error => this.setState({error}));
  }

  render() {
    if (this.state.statMap === null) {
      if (this.state.error) {
        return <NotFound/>
      }
      return <Loading/>
    }
    return <StatMapView stats={this.state.statMap} ratingMap={this.props.ratingMap}/>;
  }
}
