import React from 'react';

import axios from "axios";

import {Loading} from '../../utils/utils';
import {apiPath, CubeablesContainer, DraftPick, DraftSeat} from '../../models/models';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import CubeablesCollectionSpoilerView from "../../views/cubeablescollectionview/CubeablesCollectionSpoilerView";
import PaginationBar from "../../utils/PaginationBar";
import DraftPickView from "../../views/draft/DraftPickView";
import store from "../../state/store";
import Col from "react-bootstrap/Col";


interface SeatPageProps {
  match: any
}


interface SeatPageState {
  seat: DraftSeat | null;
  pick: DraftPick | null;
  pool: CubeablesContainer | null;
  pickNumber: number;
  pickCount: number;
}


export default class SeatPage extends React.Component<SeatPageProps, SeatPageState> {

  constructor(props: SeatPageProps) {
    super(props);
    this.state = {
      seat: null,
      pick: null,
      pool: null,
      pickNumber: props.match.params.seat || 0,
      pickCount: 0,
    };
  }

  getPick = (pickNumber: number): void => {
    console.log(store.getState().authenticated);
    axios.get(
      apiPath + 'draft/seat/' + this.props.match.params.id + '/' + pickNumber + '/',
      {
        headers: store.getState().authenticated && {
          "Authorization": `Token ${store.getState().token}`,
        },
      },
    ).then(
      response => this.setState(
        {
          seat: DraftSeat.fromRemote(response.data.seat),
          pick: response.data.pick ? DraftPick.fromRemote(response.data.pick) : null,
          pool: CubeablesContainer.fromRemote(response.data.pool),
          pickCount: response.data.pick_count,
          pickNumber: pickNumber,
        }
      )
    )
  };

  componentDidMount(): void {
    this.getPick(this.state.pickNumber)
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
          handleNewOffset={this.getPick}
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
          this.state.pool ? <CubeablesCollectionSpoilerView
            cubeablesContainer={this.state.pool}
            cubeableType="Cubeables"
          /> : <Loading/>
        }
      </Row>
    </Container>

  }

}
