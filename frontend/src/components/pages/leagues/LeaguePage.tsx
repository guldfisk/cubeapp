import React from 'react';


import {League} from '../../models/models';
import {Loading} from "../../utils/utils";
import LeagueView from "../../views/leagues/LeagueView";


interface LeaguePageProps {
  match: any
}

interface LeaguePageState {
  league: League | null
}


export default class LeaguePage extends React.Component<LeaguePageProps, LeaguePageState> {

  constructor(props: LeaguePageProps) {
    super(props);
    this.state = {
      league: null,
    };
  }

  componentDidMount() {
    League.get(this.props.match.params.id).then(
      league => {
        this.setState({league});
      }
    );
  }

  render() {
    return this.state.league ? <LeagueView
      league={this.state.league}
    /> : <Loading/>;
  }

}
