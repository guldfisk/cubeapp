import React from 'react';

import {
  TournamentParticipant
} from "../../models/models";
import {ParticipantView} from "./ParticipantView";


interface ParticipantsViewProps {
  participants: TournamentParticipant[];
}


interface ParticipantsViewState {
}


export default class ParticipantsView extends React.Component<ParticipantsViewProps, ParticipantsViewState> {

  constructor(props: ParticipantsViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <>
      {
        this.props.participants.map(
          participant => <ParticipantView participant={participant} key={participant.id}/>
        )
      }
    </>
  }

}

