import React from 'react';

import StatHistoryView from "../../views/rating/StatHistoryView";
import {CardboardStatHistory, CubeRelease, CubeReleaseMeta} from '../../models/models';
import {Loading} from '../../utils/utils';
import {Link} from "react-router-dom";


interface RatedNodePageProps {
  match: any
}


interface RatedNodePageState {
  statHistory: CardboardStatHistory | null
  release: CubeReleaseMeta | null
}


export default class CardboardDetailPage extends React.Component<RatedNodePageProps, RatedNodePageState> {

  constructor(props: RatedNodePageProps) {
    super(props);
    this.state = {
      statHistory: null,
      release: null,
    };
  }

  componentDidMount() {
    CubeRelease.ratingMap(this.props.match.params.releaseId).then(
      release => CardboardStatHistory.get(this.props.match.params.cardboardId, release.id).then(
        statHistory => this.setState({statHistory})
      )
    );
    CubeReleaseMeta.get(this.props.match.params.releaseId).then(
      (release) => this.setState({release})
    )
  }

  render() {
    const cardboardName = this.props.match.params.cardboardId.replace('_', '/');
    return <>
      {
        this.state.statHistory
          ? <h3>
            {cardboardName}
          </h3> : <Loading/>
      }
      {
        this.state.release && <Link to={`/decks/?query=u=${this.state.release.cubeId} p:[n=${cardboardName}]`}>
          Decks
        </Link>
      }
      {
        this.state.statHistory ? <StatHistoryView stats={this.state.statHistory}/> : <Loading/>
      }
    </>

  }

}