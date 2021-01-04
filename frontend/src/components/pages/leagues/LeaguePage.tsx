import React from 'react';

import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";

import {FullDeck, League} from '../../models/models';
import {Loading, range} from "../../utils/utils";
import {LeagueView} from "../../views/leagues/LeagueView";
import PaginationBar from "../../utils/PaginationBar";
import DecksMultiView from "../../views/limited/decks/DecksMultiView";


interface LeaguePageProps {
  match: any
}

interface LeaguePageState {
  league: League | null
  decks: FullDeck[]
  offset: number
  hits: number
  pageSize: number

}


export default class LeaguePage extends React.Component<LeaguePageProps, LeaguePageState> {

  constructor(props: LeaguePageProps) {
    super(props);
    this.state = {
      league: null,
      decks: [],
      offset: 0,
      hits: 0,
      pageSize: 10,
    };
  }

  componentDidMount() {
    this.refresh();
    this.fetchDecks();
  }

  refresh = (): void => {
    League.get(this.props.match.params.id).then(
      league => {
        this.setState({league});
      }
    );
  };

  fetchDecks = (offset: number = 0) => {
    League.eligibleDecks(
      this.props.match.params.id,
      offset,
      this.state.pageSize,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            decks: objects,
            hits,
            offset,
          }
        )
      }
    );
  };

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
        <Row>
          <PaginationBar
            hits={this.state.hits}
            offset={this.state.offset}
            handleNewOffset={this.fetchDecks}
            pageSize={this.state.pageSize}
            maxPageDisplay={7}
          />
          <span>
        {
          `Showing ${
            this.state.offset
          } - ${
            Math.min(this.state.offset + this.state.pageSize, this.state.hits)
          } out of ${
            this.state.hits
          } results.`
        }
      </span>
        </Row>
        <Row>
          <DecksMultiView decks={this.state.decks}/>
        </Row>
        <Row>
          <PaginationBar
            hits={this.state.hits}
            offset={this.state.offset}
            handleNewOffset={this.fetchDecks}
            pageSize={this.state.pageSize}
            maxPageDisplay={7}
          />
          <select
            name="pageSize"
            value={this.state.pageSize}
            onChange={
              event => this.setState(
                {pageSize: parseInt(event.target.value)},
                () => this.fetchDecks(this.state.offset),
              )
            }
          >
            {
              Array.from(range(5, 35, 5)).map(
                v => <option value={v}>{v}</option>
              )
            }
          </select>
        </Row>
      </Container>
    </>;
  }

}
