import React from 'react';

import axios from "axios";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import {apiPath, DraftPick, DraftSeat, PickPool} from '../../models/models';
import {Loading} from '../../utils/utils';

import PaginationBar from "../../utils/PaginationBar";
import DraftPickView from "../../views/draft/DraftPickView";
import {connect} from "react-redux";
import history from "../../routing/history";
import PickPoolSpoiler from "../../views/cubeablescollectionview/PickPoolSpoiler";


interface SeatPageProps {
  match: any;
  authenticated: boolean;
  token: string;
}


interface SeatPageState {
  seat: DraftSeat | null;
  pick: DraftPick | null;
  pool: PickPool | null;
  pickNumber: number;
  pickCount: number;
  requiresAuthenticated: boolean;
}


class SeatPage extends React.Component<SeatPageProps, SeatPageState> {

  constructor(props: SeatPageProps) {
    super(props);
    this.state = {
      seat: null,
      pick: null,
      pool: null,
      pickNumber: parseInt(props.match.params.seat),
      pickCount: 0,
      requiresAuthenticated: false,
    };
  }

  getPick = (pickNumber: number): Promise<void> => {
    return axios.get(
      apiPath + 'draft/seat/' + this.props.match.params.id + '/' + pickNumber + '/',
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
          pickNumber: pickNumber,
        }
      )
    )
  };

  pickClicked = (pickNumber: number): void => {
    history.push(
      {
        pathname: '/seat/' + this.props.match.params.id + '/' + pickNumber + '/',
      }
    );
  };

  onUpdateOrMount = (): void => {
    if (
      !this.state.seat && !this.state.requiresAuthenticated && !this.props.authenticated
      || this.props.authenticated && !this.state.seat
      || this.props.match.params.seat != this.state.pickNumber
    ) {
      this.getPick(parseInt(this.props.match.params.seat)).catch(() => this.setState({requiresAuthenticated: true}))
    }
  };

  componentDidMount(): void {
    this.onUpdateOrMount();
  }

  componentDidUpdate(prevProps: Readonly<SeatPageProps>, prevState: Readonly<SeatPageState>, snapshot?: any): void {
    this.onUpdateOrMount();
  }

  render() {
    return <Container>
      {
        this.state.seat ? <Row>
          <Col>
            <label
              className='explain-label'
            >
              User
            </label>
            {this.state.seat.user.username}
          </Col>
        </Row> : undefined
      }
      <Row>
        <PaginationBar
          hits={this.state.pickCount}
          offset={this.state.pickNumber}
          handleNewOffset={this.pickClicked}
          pageSize={1}
          maxPageDisplay={10}
        />
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
            onCubeableClicked={((cubeable, pickNumber) => this.pickClicked(pickNumber))}
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


const mapDispatchToProps = (dispatch: any) => {
  return {};
};


export default connect(mapStateToProps, mapDispatchToProps)(SeatPage);
