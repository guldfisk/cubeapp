import React from 'react';


import Card from "react-bootstrap/Card";
import {Link} from "react-router-dom";

import {
  FullScheduledMatch, ScheduledMatch,
} from "../../models/models";
import {ParticipantView} from "./ParticipantView";
import MatchView from "./MatchView";


interface FullMatchViewProps {
  match: FullScheduledMatch;
  handleSubmitted?: (match: ScheduledMatch) => void;
}


interface FullMatchViewState {
}


export class FullMatchView extends React.Component<FullMatchViewProps, FullMatchViewState> {

  constructor(props: FullMatchViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <Card>
      <Card.Header>
        <Link
          className='explain-label'
          to={'/tournaments/' + this.props.match.tournament.id + '/'}
        >
          {this.props.match.tournament.name}
        </Link>
        <label
          className='explain-label'
        >
          {'Round ' + (this.props.match.round + 1)}
        </label>
        {
          this.props.match.tournament.participants.map(
            participant => <ParticipantView participant={participant}/>
          )
        }
      </Card.Header>
      <Card.Body>
        <MatchView
          match={this.props.match}
          handleSubmitted={this.props.handleSubmitted}
        />
      </Card.Body>
    </Card>
  }

}

