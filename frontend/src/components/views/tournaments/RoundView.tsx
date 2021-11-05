import React from 'react';

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import {
  ScheduledMatch, Tournament,
  TournamentRound,
} from "../../models/models";
import MatchView from "./MatchView";


interface RoundViewProps {
  round: TournamentRound;
  tournament?: Tournament | null;
  handleMatchSubmitted: ((match: ScheduledMatch) => void) | null;
}


interface RoundViewState {
}


export default class RoundView extends React.Component<RoundViewProps, RoundViewState> {

  constructor(props: RoundViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <Container fluid>
      <Row><h4>{'Round ' + (this.props.round.index + 1)}</h4></Row>
      {
        this.props.round.matches.map(
          match => <Row>
            <MatchView
              match={match}
              round={this.props.round}
              tournament={this.props.tournament}
              handleSubmitted={this.props.handleMatchSubmitted}
            />
          </Row>
        )
      }
    </Container>
  }

}

