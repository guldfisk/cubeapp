import React from 'react';

import {
  TournamentParticipant
} from "../../models/models";
import Card from "react-bootstrap/Card";
import {Link} from "react-router-dom";


interface ParticipantViewProps {
  participant: TournamentParticipant;
}


interface ParticipantViewState {
}


export class ParticipantView extends React.Component<ParticipantViewProps, ParticipantViewState> {

  constructor(props: ParticipantViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <Card>
      <Card.Header>
        <label>
          {
            (this.props.participant.player ? this.props.participant.player.username + ' - ' : '')
          }
        </label>
        <Link
          to={'/pools/' + this.props.participant.deck.poolId + '/'}
        >
          {this.props.participant.deck.name}
        </Link>
      </Card.Header>
    </Card>
  }

}

