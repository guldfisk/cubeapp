import React from 'react';

import {
  League,
} from "../../models/models";


interface LeagueSettingsViewProps {
  league: League;
}


interface LeagueSettingsViewState {
}


export default class LeagueSettingsView extends React.Component<LeagueSettingsViewProps, LeagueSettingsViewState> {

  constructor(props: LeagueSettingsViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <ul>
      <li>
        <label
          className='explain-label'
        >
          Previous N Releases
        </label>
        {this.props.league.previousNReleases}
      </li>
      <li>
        <label
          className='explain-label'
        >
          SeasonSize
        </label>
        {this.props.league.seasonSize}
      </li>
      <li>
        <label
          className='explain-label'
        >
          Top N From Previous Season
        </label>
        {this.props.league.topNFromPreviousSeason}
      </li>
      <li>
        <label
          className='explain-label'
        >
          Low Participation Prioritization Amount
        </label>
        {this.props.league.lowParticipationPrioritizationAmount}
      </li>
      <li>
        <label
          className='explain-label'
        >
          Tournament Type
        </label>
        {this.props.league.tournamentType}
      </li>
      <li>
        <label
          className='explain-label'
        >
          Match Type
        </label>
        {this.props.league.matchType.fullName()}
      </li>
      <li>
        <label
          className='explain-label'
        >
          Rating Change
        </label>
        {this.props.league.ratingChange}
      </li>
    </ul>
  }

}

