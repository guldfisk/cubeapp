import React, {RefObject} from 'react';

import {
  FullDeck,
  League, QuickMatch, Season,
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
import {Form} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import {connect} from "react-redux";
import Row from "react-bootstrap/Row";


interface LeagueViewProps {
  authenticated: boolean;
  league: League;
}


interface LeagueViewState {
  quickMatchRated: boolean;
}


class LeagueView extends React.Component<LeagueViewProps, LeagueViewState> {
  seasonsPaginatorRef: RefObject<Paginator<Season>>;
  quickMatchesPaginatorRef: RefObject<Paginator<QuickMatch>>;

  constructor(props: LeagueViewProps) {
    super(props);
    this.seasonsPaginatorRef = React.createRef();
    this.quickMatchesPaginatorRef = React.createRef();
    this.state = {
      quickMatchRated: false,
    }
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
          mountOnEnter={true}
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
          <Tab eventKey='quickMatches' title='Quick Matches'>
            {
              this.props.authenticated && <Form
                onSubmit={
                  (event: any) => {
                    QuickMatch.createQuickMatch(this.props.league.id, this.state.quickMatchRated).then(
                      () => this.quickMatchesPaginatorRef.current.refresh()
                    );
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }
              >
                <Form.Group controlId="rated">
                  <Form.Label>Rated</Form.Label>
                  <input
                    type="checkbox"
                    checked={this.state.quickMatchRated}
                    onClick={
                      (event: any) => this.setState({quickMatchRated: event.target.checked})
                    }
                  />
                </Form.Group>
                <Button
                  type="submit"
                  style={
                    {
                      marginBottom: '2em',
                    }
                  }
                >
                  New Quick Match
                </Button>
              </Form>
            }
            <Paginator
              ref={this.quickMatchesPaginatorRef}
              fetch={
                (offset, limit) => QuickMatch.forLeague(
                  this.props.league.id,
                  offset,
                  limit,
                )
              }
              renderBody={
                (items: QuickMatch[]) => items.map(
                  season => <TournamentView
                    tournament={season.tournament}
                    handleCanceled={() => this.quickMatchesPaginatorRef.current.refresh()}
                    handleMatchSubmitted={() => this.quickMatchesPaginatorRef.current.refresh()}
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

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
  };
};


export default connect(mapStateToProps)(LeagueView);
