import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {FullLimitedSession, User} from "../../models/models";
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


interface ResultSubmitterProps {
  playerOne?: User;
  playerTwo?: User;
  players: User[];
  handlePlayerSubmitted: (player: User, one: boolean) => void;
  handleSubmit: (playerOneWins: number, playerTwoWins: number, draws: number) => void;
}


class ResultSubmitter extends React.Component<ResultSubmitterProps> {

  handleSubmit = (event: any) => {
    if (event.target.elements.playerOneWins.value && event.target.elements.playerTwoWins) {
      this.props.handleSubmit(
        event.target.elements.playerOneWins.value,
        event.target.elements.playerTwoWins.value,
        event.target.elements.draws.value ? event.target.elements.draws.value : 0,
      );
    }
    event.preventDefault();
    event.stopPropagation();
  };

  onPlayerSelected = (playerId: string, one: boolean): void => {
    for (const player of this.props.players) {
      if (player.id == playerId) {
        this.props.handlePlayerSubmitted(player, one);
        return;
      }
    }
  };

  render() {
    console.log(this.props.playerOne, this.props.playerTwo);
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
                user => !this.props.playerTwo || user.id != this.props.playerTwo.id
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
          <Form.Control type="number" placeholder="wins" id="playerOneWins"/>
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
                user => !this.props.playerOne || user.id != this.props.playerOne.id
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
          <Form.Control type="number" placeholder="wins" id="playerTwoWins"/>
        </Col>
        <Col>
          <Form.Control type="number" placeholder="draws" id="draws"/>
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
}


class SessionView extends React.Component<SessionViewProps, SessionViewState> {

  constructor(props: SessionViewProps) {
    super(props);
    this.state = {
      playerOne: null,
      playerTwo: null,
    }
  }

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
        text: 'Decks',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell.length,
      },
      {
        text: '',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => (
          this.props.session.state == 'FINISHED'
          || this.props.session.state == 'PLAYING' && this.props.session.openDecks
          || this.props.authenticated && this.props.user.id == row.user.id
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

    return <Container>
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
            Open decks
          </label>
          <label>{this.props.session.openDecks.toString()}</label>
        </Col>
      </Row>
      <Row>
        <PoolSpecificationView specification={this.props.session.poolSpecification}/>
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
              players={this.props.session.players}
              playerOne={this.state.playerOne}
              playerTwo={this.state.playerTwo}
              handlePlayerSubmitted={
                (player, one) => {
                  if (one) {
                    this.setState({playerOne: player})
                  } else {
                    this.setState({playerTwo: player})
                  }
                }
              }
              handleSubmit={
                (playerOneWins, playerTwoWins, draws) => {
                  if (!this.state.playerOne && !this.state.playerTwo) {
                    return
                  }
                  this.props.session.submitResult(
                    {
                      draws: parseInt(draws as any),
                      players: [
                        {user_id: parseInt(this.state.playerOne.id), wins: parseInt(playerOneWins as any)},
                        {user_id: parseInt(this.state.playerTwo.id), wins: parseInt(playerTwoWins as any)},
                      ]
                    }
                  ).then(
                    this.props.onResultSubmitted
                  )
                }
              }
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
    </Container>
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