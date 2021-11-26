import React from 'react';

import StatHistoryView from "../../views/rating/StatHistoryView";
import {CardboardStatHistory, CubeRelease} from '../../models/models';
import {Loading} from '../../utils/utils';


interface RatedNodePageProps {
  match: any
}


interface RatedNodePageState {
  statHistory: CardboardStatHistory | null
}


export default class CardboardDetailPage extends React.Component<RatedNodePageProps, RatedNodePageState> {

  constructor(props: RatedNodePageProps) {
    super(props);
    this.state = {
      statHistory: null,
    };
  }

  componentDidMount() {
    CubeRelease.ratingMap(this.props.match.params.releaseId).then(
      release => CardboardStatHistory.get(this.props.match.params.cardboardId, release.id).then(
        statHistory => this.setState({statHistory})
      )
    )
  }

  render() {

    return <>
      {
        this.state.statHistory
          ? <h3>
            {this.props.match.params.cardboardId.replace('_', '/')}
          </h3> : <Loading/>
      }
      {
        this.state.statHistory ? <StatHistoryView stats={this.state.statHistory}/> : <Loading/>
      }
    </>

  }

}