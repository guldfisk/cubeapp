import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {Cardboard, FullLimitedSession, MatchResult, Printing, User} from "../../models/models";
import {Link} from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {DateListItem} from "../../utils/listitems";
import {connect} from "react-redux";

import '../../../styling/SessionsView.css';
import PoolSpecificationView from "./PoolSpecificationView";
import MatchResultsView from "./MatchResultsView";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {sizeTwoSetCombinations} from "../../utils/utils";
import {ConfirmationDialog} from "../../utils/dialogs";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Card from "react-bootstrap/Card";
import {CardboardSearchView, PrintingSearchView} from "../search/SearchView";
import TrapParseView from "../traps/TrapParseView";
import ConstrainedNodeParseView from "../traps/ConstrainedNodeParseView";
import GroupAddView from "../groupmap/GroupAddView";
import InfinitesView from "../infinites/InfinitesView";


interface ResultSubmitterProps {
  playerOne?: User;
  playerOneWins?: number;
  playerTwo?: User;
  playerTwoWins?: number;
  players: User[];
  results: MatchResult[];
  draws?: number;
  handlePlayerSubmitted: (player: User | null, one: boolean) => void;
  handlePlayerWinsSubmitted: (wins: number, one: boolean) => void;
  handleDrawsSubmitted: (draws: number) => void;
  handleSubmit: () => void;
}


class ResultSubmitter extends React.Component<ResultSubmitterProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit();
    event.preventDefault();
    event.stopPropagation();
  };

  onPlayerSelected = (playerId: string, one: boolean): void => {
    if (playerId == "0") {
      this.props.handlePlayerSubmitted(null, one);
      return;
    }
    for (const player of this.props.players) {
      if (player.id == playerId) {
        this.props.handlePlayerSubmitted(player, one);
        return;
      }
    }
  };

  getPlayerMatchCount = (): { [key: string]: number } => {
    const counts: { [key: string]: number } = {};
    for (const result of this.props.results) {
      for (const player of result.players) {
        if (counts[player.user.id]) {
          counts[player.user.id] += 1
        } else {
          counts[player.user.id] = 1
        }
      }
    }
    return counts;
  };

  getForbiddenPlayers = (user: User | null, playerMatchCounts: { [key: string]: number }): string[] => {
    let forbidden: string[] = [];
    if (user) {
      forbidden.push(user.id);
      for (const result of this.props.results) {
        if (result.players.some(player => player.user.id == user.id)) {
          forbidden = forbidden.concat(result.players.map(player => player.user.id))
        }
      }
    }
    for (const player of this.props.players) {
      if (playerMatchCounts[player.id] && playerMatchCounts[player.id] >= this.props.players.length - 1) {
        forbidden.push(player.id)
      }
    }
    return forbidden;
  };

  render() {
    const playerMatchCounts = this.getPlayerMatchCount();

    const playerOneForbidden = this.getForbiddenPlayers(this.props.playerTwo, playerMatchCounts);
    const playerTwoForbidden = this.getForbiddenPlayers(this.props.playerOne, playerMatchCounts);

    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Row>
        <Col>
          <Form.Control
            as="select"
            onChange={(event: any) => this.onPlayerSelected(event.target.value, true)}
            value={this.props.playerOne ? this.props.playerOne.id : "0"}
          >
            <option key={0} value={0}>Player 1</option>
            {
              this.props.players.filter(
                user => !playerOneForbidden.includes(user.id)
              ).map(
                user => {
                  return <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.username}
                  </option>
                }
              )
            }
          </Form.Control>
        </Col>
        <Col>
          <Form.Control
            type="number"
            placeholder="wins"
            value={this.props.playerOneWins != null ? this.props.playerOneWins.toString() : "0"}
            onChange={(event: any) => this.props.handlePlayerWinsSubmitted(parseInt(event.target.value), true)}
          />
        </Col>
        <Col>
          <Form.Control
            as="select"
            onChange={(event: any) => this.onPlayerSelected(event.target.value, false)}
            value={this.props.playerTwo ? this.props.playerTwo.id : "0"}
          >
            <option value={0}>Player 2</option>
            {
              this.props.players.filter(
                user => !playerTwoForbidden.includes(user.id)
              ).map(
                user => {
                  return <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.username}
                  </option>
                }
              )
            }
          </Form.Control>
        </Col>
        <Col>
          <Form.Control
            type="number"
            placeholder="wins"
            value={this.props.playerTwoWins != null ? this.props.playerTwoWins.toString() : "0"}
            onChange={(event: any) => this.props.handlePlayerWinsSubmitted(parseInt(event.target.value), false)}
          />
        </Col>
        <Col>
          <Form.Control
            type="number"
            placeholder="draws"
            value={this.props.draws != null ? this.props.draws.toString() : "0"}
            onChange={(event: any) => this.props.handleDrawsSubmitted(parseInt(event.target.value))}
          />
        </Col>
        <Col>
          <Button type="submit">Submit result</Button>
        </Col>
      </Form.Row>

    </Form>
  }

}

interface SessionViewProps {
  session: FullLimitedSession;
  authenticated: boolean;
  user: User | null;
  onResultSubmitted: () => void;
}


interface SessionViewState {
  playerOne: User | null;
  playerTwo: User | null;
  playerOneWins: number | null;
  playerTwoWins: number | null;
  draws: number | null;
  completing: boolean;
}


class SessionView extends React.Component<SessionViewProps, SessionViewState> {

  constructor(props: SessionViewProps) {
    super(props);
    this.state = {
      playerOne: null,
      playerTwo: null,
      playerOneWins: 0,
      playerTwoWins: 0,
      draws: 0,
      completing: false,
    }
  }

  handleResultSubmitted = (): void => {
    if (
      !this.state.playerOne
      || !this.state.playerTwo
      || this.state.playerOneWins === null
      || this.state.playerTwoWins === null
    ) {
      return
    }
    this.props.session.submitResult(
      {
        draws: this.state.draws ? this.state.draws : 0,
        players: [
          {user_id: parseInt(this.state.playerOne.id), wins: this.state.playerOneWins},
          {user_id: parseInt(this.state.playerTwo.id), wins: this.state.playerTwoWins},
        ]
      }
    ).then(
      () => this.setState(
        {
          playerOne: null,
          playerTwo: null,
          playerOneWins: null,
          playerTwoWins: null,
          draws: null,
        },
        this.props.onResultSubmitted,
      )
    )
  };

  complete = (): void => {
    this.props.session.complete().then(this.props.onResultSubmitted)
  };

  render() {

    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'user',
        text: 'Player',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell.username,
      },
      {
        dataField: 'decks',
        text: 'Deck',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => !!cell.length,
      },
      {
        text: '',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => (
          this.props.session.publicPools()
          || this.props.authenticated && (
            this.props.user.id == row.user.id
            || this.props.session.openDecks
            && this.props.session.pools.some(
              pool => pool.decks && pool.user.id == this.props.user.id
            )
          )
        ) ? <Link
          to={'/pools/' + row.id + '/'}
        >
          view
        </Link> : undefined,
        sort: false,
        editable: false,
        isDummyField: true,
      },
    ];

    return <>
      <ConfirmationDialog
        show={this.state.completing}
        callback={() => this.setState({completing: null}, this.complete)}
        cancel={() => this.setState({completing: null})}
      />
      <Container>
        <Row><h3>{this.props.session.name}</h3></Row>
        <Row>
          <Col>
            <label
              className='explain-label'
            >
              Format
            </label>
            <label>{this.props.session.format}</label>
          </Col>
          <Col>
            <label
              className='explain-label'
            >
              Game Type
            </label>
            <label>{this.props.session.gameType}</label>
          </Col>
          <Col>
            <label
              className='explain-label'
            >
              State
            </label>
            <label>{this.props.session.state}</label>
          </Col>
        </Row>
        <Row>
          <Col>
            <label
              className='explain-label'
            >
              Created
            </label>
            <DateListItem date={this.props.session.createdAt}/>
          </Col>
          <Col>
            <label
              className='explain-label'
            >
              Playing
            </label>
            {this.props.session.playingAt ? <DateListItem date={this.props.session.playingAt}/> : undefined}
          </Col>
          <Col>
            <label
              className='explain-label'
            >
              Finished
            </label>
            {this.props.session.finishedAt ? <DateListItem date={this.props.session.finishedAt}/> : undefined}
          </Col>
        </Row>
        <Row>
          <Col>
            <label
              className='explain-label'
            >
              Open Decks
            </label>
            <label>{this.props.session.openDecks.toString()}</label>
          </Col>
          <Col>
            <label
              className='explain-label'
            >
              Open Pools
            </label>
            <label>{this.props.session.openPools.toString()}</label>
          </Col>
        </Row>
        <Row>
          <Tabs
            id='limited-session-info-tabs'
            defaultActiveKey='poolSpecification'
          >
            <Tab eventKey='poolSpecification' title='Pool Specification'>
              <PoolSpecificationView specification={this.props.session.poolSpecification}/>
            </Tab>
            <Tab eventKey='infinites' title='Infinites'>
              <InfinitesView
                infinites={this.props.session.infinites}
              />
            </Tab>
          </Tabs>
        </Row>
        <Row>
          <BootstrapTable
            keyField='id'
            data={this.props.session.pools}
            columns={columns}
            bootstrap4
            condensed
          />
        </Row>
        {
          this.props.session.state === 'PLAYING'
          && this.props.authenticated
          && this.props.session.results.length < sizeTwoSetCombinations(this.props.session.players.length) ?
            <Row>
              <ResultSubmitter
                results={this.props.session.results}
                players={this.props.session.players}
                playerOne={this.state.playerOne}
                playerTwo={this.state.playerTwo}
                playerOneWins={this.state.playerOneWins}
                playerTwoWins={this.state.playerTwoWins}
                draws={this.state.draws}
                handlePlayerSubmitted={
                  (player, one) => {
                    if (one) {
                      this.setState({playerOne: player})
                    } else {
                      this.setState({playerTwo: player})
                    }
                  }
                }
                handlePlayerWinsSubmitted={
                  (wins, one) => {
                    if (one) {
                      this.setState({playerOneWins: wins})
                    } else {
                      this.setState({playerTwoWins: wins})
                    }
                  }
                }
                handleDrawsSubmitted={draws => this.setState({draws})}
                handleSubmit={this.handleResultSubmitted}
              />
            </Row> : undefined
        }
        {
          this.props.session.results.length > 0 ?
            <Row>
              <h4>Results</h4>
              <MatchResultsView
                results={this.props.session.results}
              />
            </Row> : undefined
        }
        {
          this.props.authenticated && this.props.session.state == 'PLAYING' ?
            <Row>
              <Button
                onClick={
                  () => {
                    if (
                      this.props.session.results.length >= sizeTwoSetCombinations(this.props.session.players.length)
                    ) {
                      this.complete()
                    } else {
                      this.setState({completing: true})
                    }
                  }
                }
              >Completed</Button>
            </Row> : undefined
        }
      </Container>
    </>
  }

}

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    user: state.user,
  };
};


const mapDispatchToProps = (dispatch: any) => {
  return {};
};


export default connect(mapStateToProps, mapDispatchToProps)(SessionView);