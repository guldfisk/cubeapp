import React from 'react';

import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import PaginationBar from "../../utils/PaginationBar";
import Row from "react-bootstrap/Row";
import {Link} from "react-router-dom";

import {Cube} from '../../models/models';
import CubesView from '../../views/cubeview/CubesView';


const pageSize: number = 10;


interface CubesPageState {
  cubes: Cube[]
  offset: number
  hits: number
}


export default class CubesPage extends React.Component<null, CubesPageState> {

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
    return <Container fluid>
      <Row>
        <Col sm={2}>
          <Card>
            <Card.Header>
              Actions
            </Card.Header>
            <Card.Body>
              <p>
                <Link
                  to={"/create-cube/"}
                >
                  Create Cube
                </Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col>
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
        </Col>
      </Row>
    </Container>
  }

}
