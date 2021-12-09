import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import {Link} from "react-router-dom";

import {ScheduledMatch, Tournament} from "../../models/models";
import RoundView from "./RoundView";
import ParticipantsView from "./ParticipantsView";
import {DateListItem} from "../../utils/listitems";
import {ConfirmationDialog} from "../../utils/dialogs";


interface TournamentViewProps {
  tournament: Tournament;
  handleMatchSubmitted?: ((match: ScheduledMatch) => void) | null;
  handleCanceled?: ((tournament: Tournament) => void) | null;
}


interface TournamentViewState {
  canceling: boolean;
}


export default class TournamentView extends React.Component<TournamentViewProps, TournamentViewState> {

  constructor(props: TournamentViewProps) {
    super(props);
    this.state = {
      canceling: false,
    }
  }

  render() {
    return <>
      <ConfirmationDialog
        show={this.state.canceling}
        callback={
          () => this.setState(
            {canceling: false},
            () => {
              const pendingCancellation = this.props.tournament.cancel();
              if (this.props.handleCanceled) {
                pendingCancellation.then(this.props.handleCanceled)
              }
            }
          )
        }
        cancel={() => this.setState({canceling: false})}
      />
      <Container fluid>
        <Card>
          <Card.Header
            className="d-flex justify-content-between panel-heading"
          >
            <h4>
              <label
                className='explain-label'
              >
                Tournament
              </label>
              <Link
                to={'/tournaments/' + this.props.tournament.id + '/'}
              >
                {this.props.tournament.name}
              </Link>
            </h4>
          </Card.Header>
          <Card.Body>
            {
              this.props.tournament.results.length ? <Row>
                <label
                  className='explain-label'
                >
                  Winners
                </label>
                <ParticipantsView participants={this.props.tournament.results.map(result => result.participant)}/>
              </Row> : null
            }
            <Row>
              <label
                className='explain-label'
              >
                Participants
              </label>
              <ParticipantsView participants={this.props.tournament.participants}/>
            </Row>
            <Row>
              <Col>
                <label
                  className='explain-label'
                >
                  State
                </label>
                <label>{this.props.tournament.state}</label>
              </Col>
              <Col>
                <label
                  className='explain-label'
                >
                  Tournament Type
                </label>
                <label>{this.props.tournament.tournamentType}</label>
              </Col>
              <Col>
                <label
                  className='explain-label'
                >
                  Match Type
                </label>
                <label>{this.props.tournament.matchType.fullName()}</label>
              </Col>
            </Row>
            <Row>
              <Col>
                <label
                  className='explain-label'
                >
                  Completed Rounds
                </label>
                <span>{this.props.tournament.completedRounds() + '/' + this.props.tournament.roundAmount}</span>
              </Col>
              <Col>
                <label
                  className='explain-label'
                >
                  Created At
                </label>
                <DateListItem date={this.props.tournament.createdAt}/>
              </Col>
              <Col>
                <label
                  className='explain-label'
                >
                  Finished At
                </label>
                {
                  this.props.tournament.finishedAt && <DateListItem date={this.props.tournament.finishedAt}/>
                }
              </Col>
            </Row>
            <Row>
              {
                this.props.tournament.rounds.map(
                  (round, idx) => <Col key={idx}>
                    <RoundView
                      round={round}
                      tournament={this.props.tournament}
                      handleMatchSubmitted={this.props.handleMatchSubmitted}
                    />
                  </Col>
                )
              }
            </Row>
            {
              this.props.tournament.state == 'ONGOING' && <Row>
                <Button
                  onClick={
                    () => this.setState({canceling: true})
                  }
                >
                  Cancel
                </Button>
              </Row>
            }
          </Card.Body>
        </Card>
      </Container>
    </>
  }

}

