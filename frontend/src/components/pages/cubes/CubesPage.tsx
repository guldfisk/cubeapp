import React from 'react';

import {Cube} from '../../models/models';

import CubesView from '../../views/cubeview/CubesView';

import Col from "react-bootstrap/Col";
import PaginationBar from "../../utils/PaginationBar";


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
    </Col>
  }

}

export default CubesPage;