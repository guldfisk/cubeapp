import React from 'react';

import {Cube} from '../../models/models';

import CubesView from '../../views/cubeview/CubesView';

import Col from "react-bootstrap/Col";
import PaginationBar from "../../utils/PaginationBar";
import Row from "react-bootstrap/Row";
import RecentDecksView from "../../views/limited/decks/RecentDecksView";


const pageSize: number = 10;


interface CubesPageState {
  cubes: Cube[]
  offset: number
  hits: number
}


class CubesPage extends React.Component<null, CubesPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      cubes: [],
      offset: 0,
      hits: 0,
    };
  }

  componentDidMount() {
    this.fetchCubes(0);
  }

  fetchCubes = (offset: number) => {
    Cube.all(
      offset,
      pageSize,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            cubes: objects,
            hits,
          }
        )
      }
    );
  };

  render() {

    return <Col>
      <Row>
        <h3>Cubes</h3>
      </Row>
      <Row>
        <PaginationBar
          hits={this.state.hits}
          offset={this.state.offset}
          handleNewOffset={this.fetchCubes}
          pageSize={pageSize}
          maxPageDisplay={7}
        />
        <CubesView
          cubes={this.state.cubes}
        />
      </Row>
      <Row>
        <h3>Recent decks</h3>
      </Row>
      <Row>
        <RecentDecksView/>
      </Row>
    </Col>
  }

}

export default CubesPage;