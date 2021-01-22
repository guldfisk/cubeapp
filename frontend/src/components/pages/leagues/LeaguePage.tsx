import React, {RefObject} from 'react';

import Container from "react-bootstrap/Container";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";

import {FullDeck, FullScheduledMatch, League, Season} from '../../models/models';
import {Loading} from "../../utils/utils";
import {LeagueView} from "../../views/leagues/LeagueView";
import DecksMultiView from "../../views/limited/decks/DecksMultiView";
import Paginator from "../../utils/Paginator";
import TournamentView from "../../views/tournaments/TournamentView";


interface LeaguePageProps {
  match: any
}

interface LeaguePageState {
  league: League | null
}


export default class LeaguePage extends React.Component<LeaguePageProps, LeaguePageState> {
  seasonsPaginatorRef: RefObject<Paginator<Season>>;

  constructor(props: LeaguePageProps) {
    super(props);
    this.seasonsPaginatorRef = React.createRef();
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
    let tournamentView = <Loading/>;
    if (this.state.league !== null) {
      tournamentView = <LeagueView
        league={this.state.league}
      />
    }
    return <>
      {tournamentView}
      <Container fluid>
        <Tabs
          id='league-tabs'
          defaultActiveKey='decks'
        >
          <Tab eventKey='decks' title='Decks'>
            <Paginator
              fetch={
                (offset, limit) => League.eligibleDecks(
                  this.props.match.params.id,
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
                  this.props.match.params.id,
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
        </Tabs>
      </Container>
    </>;
  }

}
