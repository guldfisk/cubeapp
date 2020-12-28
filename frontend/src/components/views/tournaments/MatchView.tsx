import React from 'react';

import {
  ScheduledMatch, Tournament, TournamentParticipant, User,
} from "../../models/models";
import BootstrapTable from 'react-bootstrap-table-next';

import {ParticipantView} from "./ParticipantView";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import {connect} from "react-redux";
import {integerSortFactory} from "../../utils/utils";


interface ResultSubmitterProps {
  scheduledMatch: ScheduledMatch;
  handleSubmitted: (match: ScheduledMatch) => void;
}

interface ResultSubmitterState {
  winsMap: { [key: string]: string };
  draws: number;
  errors: string[];
}


class ResultSubmitter extends React.Component<ResultSubmitterProps, ResultSubmitterState> {

  constructor(props: ResultSubmitterProps) {
    super(props);
    this.state = {
      winsMap: Object.fromEntries(props.scheduledMatch.seats.map(seat => [seat.id, '0'])),
      draws: 0,
      errors: [],
    }
  }

  handleSubmit = (event: any) => {
    this.setState({errors: []});
    event.preventDefault();
    event.stopPropagation();
    this.props.scheduledMatch.submitResult(this.state.draws, this.state.winsMap).then(
      this.props.handleSubmitted
    ).catch(
      error => this.setState(
        {
          errors: error.response.data.hasOwnProperty('errors') ?
            error.response.data.errors.map((e: any) => e.toString())
            : ['Could not submit results']
        }
      )
    )
  };

  render() {
    return <>
      <Form
        onSubmit={this.handleSubmit}
      >
        <Form.Row>
          {
            this.props.scheduledMatch.seats.map(
              seat => <>
                <Col>
                  <label>{seat.participant.fullName()}</label>
                </Col>
                <Col>
                  <Form.Control
                    type="number"
                    placeholder="wins"
                    value={this.state.winsMap[seat.id]}
                    onChange={
                      (event: any) => this.setState(
                        {
                          winsMap: {
                            ...this.state.winsMap,
                            [seat.id]: event.target.value
                          }
                        }
                      )
                    }
                  />
                </Col>
              </>
            )
          }
          <Col>
            <Form.Control
              type="number"
              placeholder="draws"
              value={this.state.draws}
              onChange={
                (event: any) => this.setState({draws: parseInt(event.target.value)})
              }
            />
          </Col>
          <Col>
            <Button type="submit">Submit result</Button>
          </Col>
        </Form.Row>
      </Form>
      {
        this.state.errors.map(
          error => <Alert variant="danger">{error}</Alert>
        )
      }
    </>
  }

}

interface MatchViewProps {
  match: ScheduledMatch;
  tournament?: Tournament | null;
  authenticated: boolean;
  user: User | null;
  handleSubmitted: ((match: ScheduledMatch) => void) | null;
}


interface MatchViewState {
  submitting: boolean;
}


class MatchView extends React.Component<MatchViewProps, MatchViewState> {

  constructor(props: MatchViewProps) {
    super(props);
    this.state = {
      submitting: false,
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
        dataField: 'participant',
        text: 'Player',
        formatter: (cell: TournamentParticipant, row: any, rowIndex: number, formatExtraData: any) => {
          return <ParticipantView participant={cell}/>
        },
      },
      {
        dataField: 'result',
        text: 'Wins',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell.wins,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
      },
    ];

    return <Card>
      <Card.Header
        className="d-flex justify-content-between panel-heading"
      >
        <span className="header-item">
          {
            this.props.match.seats.map(seat => seat.participant.fullName()).join(' vs. ') + (
              this.props.match.seats.length <= 1 ? ' (bye)' : ''
            )
          }
        </span>
        {
          this.props.authenticated
          && this.props.match.canSubmit(this.props.user)
          && (!this.props.tournament || this.props.tournament.state == 'ONGOING')
          && <Button
            onClick={() => this.setState({submitting: !this.state.submitting})}
            className='ml-auto'
          >
            {this.state.submitting ? 'Cancel' : 'Submit'}
          </Button>
        }
      </Card.Header>
      {
        (this.props.match.result || this.state.submitting) && this.props.match.seats.length > 1 && <Card.Body>
          {
            this.props.match.result && <BootstrapTable
              keyField='id'
              data={
                this.props.match.seats.sort(
                  integerSortFactory(
                    seat => seat.result.wins,
                    true,
                  )
                )
              }
              columns={columns}
              bootstrap4
              condensed
              classes="hide-header"
            />
          }
          {
            this.props.match.result && this.props.match.result.draws > 0 &&
            "Draws: " + this.props.match.result.draws
          }
          {
            this.state.submitting && <ResultSubmitter
              scheduledMatch={this.props.match}
              handleSubmitted={
                match => {
                  this.setState({submitting: false});
                  if (this.props.handleSubmitted) {
                    this.props.handleSubmitted(match)
                  }
                }
              }
            />
          }
        </Card.Body>
      }
    </Card>
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


export default connect(mapStateToProps, mapDispatchToProps)(MatchView);