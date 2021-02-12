import React from 'react';

import {
  League,
} from "../../models/models";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import {Link} from "react-router-dom";


interface LeagueViewProps {
  league: League;
}


interface LeagueViewState {
}


export default class LeagueView extends React.Component<LeagueViewProps, LeagueViewState> {

  constructor(props: LeagueViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <Container fluid>
      <Card>
        <Card.Header
          className="d-flex justify-content-between panel-heading"
        >
          <h4>
            <span className="header-item">
              <label>{this.props.league.name}</label>
            </span>
          </h4>
          <Link
            to={'/cube/' + this.props.league.cube.id + '/'}
          >
            {this.props.league.cube.name}
          </Link>
        </Card.Header>
        <Card.Body>
          <ul>
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
          </ul>
        </Card.Body>
      </Card>
    </Container>
  }

}

