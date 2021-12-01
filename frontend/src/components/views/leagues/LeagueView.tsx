import React, {RefObject} from 'react';

import Card from "react-bootstrap/Card";
import {connect} from "react-redux";
import {Link} from "react-router-dom";

import CreateQuickMatchForm from "./CreateQuickMatchForm";
import DecksMultiView from "../limited/decks/DecksMultiView";
import Leaderboard from "./Leaderboard";
import LeagueSettingsView from "./LeagueSettingsView";
import Paginator from "../../utils/Paginator";
import RoutedTabs from "../../utils/RoutedTabs";
import TournamentView from "../tournaments/TournamentView";
import {FeedLink} from "../../utils/rss";
import {FullDeck, League, QuickMatch, Season} from "../../models/models";


interface LeagueViewProps {
  match: any
  authenticated: boolean
  league: League
}


interface LeagueViewState {
  quickMatchRated: boolean
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
        <RoutedTabs
          match={this.props.match}
          tabs={
            [
              [
                'decks',
                'Decks',
                () => <Paginator
                  key="decks"
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
                />,
              ],
              [
                'seasons',
                'Seasons',
                () => <>
                  <FeedLink url={'/api/leagues/' + this.props.league.id + '/rss.xml'}/>
                  <Paginator
                    key="seasons"
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
                </>,
              ],
              [
                'quick-matches',
                'Quick Matches',
                () => <>
                  {
                    this.props.authenticated && <CreateQuickMatchForm
                      handleSubmit={
                        (rated, deckIds) => QuickMatch.createQuickMatch(
                          this.props.league.id,
                          rated,
                          deckIds,
                        ).then(
                          () => this.quickMatchesPaginatorRef.current.refresh()
                        )
                      }
                      leagueId={this.props.league.id}
                    />
                  }
                  <Paginator
                    key="quick-matches"
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
                </>,
              ],
              [
                'leaderboard',
                'Leaderboard',
                () => <Leaderboard leagueId={this.props.league.id}/>,
              ],
              [
                'settings',
                'Settings',
                () => <LeagueSettingsView league={this.props.league}/>,
              ],
            ]
          }
          defaultTab="decks"
        />
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
