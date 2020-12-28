import React from 'react';

import {Tournament} from '../../models/models';
import {Loading} from "../../utils/utils";
import TournamentView from "../../views/tournaments/TournamentView";


interface TournamentPageProps {
  match: any
}

interface TournamentPageState {
  tournament: Tournament | null;
}


export default class TournamentPage extends React.Component<TournamentPageProps, TournamentPageState> {

  constructor(props: TournamentPageProps) {
    super(props);
    this.state = {
      tournament: null,
    };
  }

  componentDidMount() {
    this.refresh();
  }

  refresh = (): void => {
    Tournament.get(this.props.match.params.id).then(
      tournament => {
        this.setState({tournament});
      }
    );
  };

  render() {
    let tournamentView = <Loading/>;
    if (this.state.tournament !== null) {
      tournamentView = <TournamentView
        tournament={this.state.tournament}
        handleCanceled={this.refresh}
        handleMatchSubmitted={this.refresh}
      />
    }
    return tournamentView;
  }

}
