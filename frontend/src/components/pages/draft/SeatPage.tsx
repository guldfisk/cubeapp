import React from 'react';

import axios from "axios";

import {Loading} from '../../utils/utils';
import {apiPath, CubeablesContainer, DraftPick} from '../../models/models';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import CubeablesCollectionSpoilerView from "../../views/cubeablescollectionview/CubeablesCollectionSpoilerView";
import PaginationBar from "../../utils/PaginationBar";
import DraftPickView from "../../views/draft/DraftPickView";
import store from "../../state/store";


interface SeatPageProps {
  match: any
}


interface SeatPageState {
  pick: DraftPick | null;
  pool: CubeablesContainer | null;
  pickNumber: number;
  pickCount: number;
}


export default class SeatPage extends React.Component<SeatPageProps, SeatPageState> {

  constructor(props: SeatPageProps) {
    super(props);
    this.state = {
      pick: null,
      pool: null,
      pickNumber: 0,
      pickCount: 0,
    };
  }

  getPick = (pickNumber: number): void => {
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
