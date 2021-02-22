import React, {RefObject} from 'react';

import {
  FullDeck,
  League, Season,
} from "../../models/models";
import Card from "react-bootstrap/Card";
import {Link} from "react-router-dom";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Paginator from "../../utils/Paginator";
import DecksMultiView from "../limited/decks/DecksMultiView";
import TournamentView from "../tournaments/TournamentView";
import Leaderboard from "./Leaderboard";
import LeagueSettingsView from "./LeagueSettingsView";


interface LeagueViewProps {
  league: League;
}


interface LeagueViewState {
}


export default class LeagueView extends React.Component<LeagueViewProps, LeagueViewState> {
  seasonsPaginatorRef: RefObject<Paginator<Season>>;

  constructor(props: LeagueViewProps) {
    super(props);
    this.seasonsPaginatorRef = React.createRef();
    this.state = {}
  }

  render() {
    return <Card>
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
        <Tabs
          id='league-tabs'
          defaultActiveKey='decks'
        >
          <Tab eventKey='decks' title='Decks'>
            <Paginator
              fetch={
                (offset, limit) => League.eligibleDecks(
                  this.props.league.id,
                  offset,
                  limit,
                )
              }
              renderBody={
                (items: FullDeck[]) => <DecksMultiView decks={items}/>
              }
            />
          </Tab>
          <Tab eventKey='seasons' title='Seasons'>
            <Paginator
              ref={this.seasonsPaginatorRef}
              fetch={
                (offset, limit) => Season.forLeague(
                  this.props.league.id,
                  offset,
                  limit,
                )
              }
              renderBody={
                (items: Season[]) => items.map(
                  season => <TournamentView
                    tournament={season.tournament}
                    handleCanceled={() => this.seasonsPaginatorRef.current.refresh()}
                    handleMatchSubmitted={() => this.seasonsPaginatorRef.current.refresh()}
                  />
                )
              }
            />
          </Tab>
          <Tab eventKey='leaderboard' title='Leaderboard'>
            <Leaderboard leagueId={this.props.league.id}/>
          </Tab>
          <Tab eventKey='settings' title='Settings'>
            <LeagueSettingsView league={this.props.league}/>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  }

}

