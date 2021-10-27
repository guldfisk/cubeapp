import React from 'react';

import axios from "axios";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import {connect} from "react-redux";

import DraftPickView from "../../views/draft/DraftPickView";
import history from "../../routing/history";
import PaginationBar from "../../utils/PaginationBar";
import PickPoolSpoiler from "../../views/cubeablescollectionview/PickPoolSpoiler";
import {apiPath, DraftPick, DraftSeat, DraftSession, PickPool} from '../../models/models';
import {Loading, NotAllowed} from '../../utils/utils';
import {Link} from "react-router-dom";
import DraftInfo from "../../views/draft/DraftInfo";


interface SeatPageProps {
  match: any;
  authenticated: boolean;
  token: string;
}


interface SeatPageState {
  seat: DraftSeat | null
  pick: DraftPick | null
  pool: PickPool | null
  pickCount: number
  requiresAuthenticated: boolean
  nextSeat: { seat_id: string, global_pick_number: string } | null
  previousSeat: { seat_id: string, global_pick_number: string } | null
  draftSession: DraftSession | null
}


class SeatPage extends React.Component<SeatPageProps, SeatPageState> {

  constructor(props: SeatPageProps) {
    super(props);
    this.state = {
      seat: null,
      pick: null,
      pool: null,
      pickCount: 0,
      requiresAuthenticated: false,
      nextSeat: null,
      previousSeat: null,
      draftSession: null,
    };
  }

  goToPick = (seatId: number | string, pickNumber: number | string): void => {
    history.push(
      {
        pathname: '/seat/' + seatId + '/' + pickNumber + '/',
      }
    );
  }

  goToSeat = (seat: { seat_id: string, global_pick_number: string }): void => {
    this.goToPick(seat.seat_id, seat.global_pick_number);
  };

  toToPickNumber = (pickNumber: number | string): void => {
    this.goToPick(this.props.match.params.seatId, pickNumber);
  };

  getPick = (onStateUpdate: (() => void) | null = null): void => {
    axios.get(
      apiPath + 'draft/seat/' + this.props.match.params.seatId + '/' + this.props.match.params.pickNumber + '/',
      {
        headers: this.props.authenticated && {
          "Authorization": `Token ${this.props.token}`,
        },
      },
    ).then(
      response => this.setState(
        {
          seat: DraftSeat.fromRemote(response.data.seat),
          pick: response.data.pick ? DraftPick.fromRemote(response.data.pick) : null,
          pool: PickPool.fromRemote(response.data.pool),
          pickCount: response.data.pick_count,
          nextSeat: response.data.next_seat,
          previousSeat: response.data.previous_seat,
        },
        onStateUpdate,
      )
    ).catch(() => this.setState({requiresAuthenticated: true}))
  };

  componentDidMount(): void {
    this.getPick(() => DraftSession.get(this.state.seat.sessionId).then(draftSession => this.setState({draftSession})));
  }

  componentDidUpdate(prevProps: Readonly<SeatPageProps>, prevState: Readonly<SeatPageState>, snapshot?: any): void {
    if (
      prevProps.match.params.seatId != this.props.match.params.seatId
      || prevProps.match.params.pickNumber != this.props.match.params.pickNumber
      || (
        this.state.requiresAuthenticated && this.props.authenticated &&
        (!prevProps.authenticated || !prevState.requiresAuthenticated)
      )
    ) {
      this.getPick();
    }
  }

  render() {
    if (this.state.requiresAuthenticated && !this.props.authenticated) {
      return <NotAllowed/>
    }
    return <Container>
      {
        this.state.seat && <Row>
          <Col>
            <h3>
              <label
                className='explain-label'
              >
                {this.state.seat.user.username}
              </label>
              {this.state.pick.pp()}
            </h3>
          </Col>
        </Row>
      }
      {
        this.state.draftSession && <>
          <Link
            to={'/drafts/' + this.state.draftSession.id}
          >
            {this.state.draftSession.name}
          </Link>
          <DraftInfo draft={this.state.draftSession}/>
        </>

      }
      <Row
        style={
          {
            justifyContent: 'space-between',
          }
        }
      >
        <Button
          disabled={!this.state.previousSeat}
          onClick={() => this.goToSeat(this.state.previousSeat)}
        >
          Previous pick from pack
        </Button>
        <PaginationBar
          hits={this.state.pickCount}
          offset={parseInt(this.props.match.params.pickNumber)}
          handleNewOffset={this.toToPickNumber}
          pageSize={1}
          maxPageDisplay={10}
        />
        <Button
          disabled={!this.state.nextSeat}
          onClick={() => this.goToSeat(this.state.nextSeat)}
        >
          Next pick from pack
        </Button>
      </Row>
      <Row>
        {
          this.state.pick ? <DraftPickView pick={this.state.pick}/> : <Loading/>
        }
      </Row>
      <Row>
        {
          this.state.pool ? <PickPoolSpoiler
            pickPool={this.state.pool}
            onCubeableClicked={((cubeable, pickNumber) => this.toToPickNumber(pickNumber))}
          /> : <Loading/>
        }
      </Row>
    </Container>

  }

}


const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    token: state.token,
  };
};


export default connect(mapStateToProps)(SeatPage);
