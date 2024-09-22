import React from "react";

import { Cube, Season } from "../models/models";

import CubesView from "../views/cubeview/CubesView";

import Col from "react-bootstrap/Col";
import PaginationBar from "../utils/PaginationBar";
import Row from "react-bootstrap/Row";
import RecentDecksView from "../views/limited/decks/RecentDecksView";
import TournamentView from "../views/tournaments/TournamentView";

const pageSize: number = 10;

interface CubesPageState {
  cubes: Cube[];
  offset: number;
  hits: number;
  season: Season | null;
}

export default class HomePage extends React.Component<null, CubesPageState> {
  constructor(props: null) {
    super(props);
    this.state = {
      cubes: [],
      offset: 0,
      hits: 0,
      season: null,
    };
  }

  componentDidMount() {
    this.fetchCubes(0);
    this.fetchSeason();
  }

  fetchSeason = () => {
    Season.recentSeason().then((season) => this.setState({ season }));
  };

  fetchCubes = (offset: number) => {
    Cube.all(offset, pageSize, true).then(({ objects, hits }) => {
      this.setState({
        cubes: objects,
        hits,
      });
    });
  };

  render() {
    return (
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
          <CubesView cubes={this.state.cubes} />
        </Row>
        {this.state.season && (
          <>
            <Row>
              <h3>Latest League Season</h3>
            </Row>
            <Row>
              <TournamentView
                tournament={this.state.season.tournament}
                handleCanceled={this.fetchSeason}
                handleMatchSubmitted={this.fetchSeason}
              />
            </Row>
          </>
        )}
        <Row>
          <h3>Recent decks</h3>
        </Row>
        <Row>
          <RecentDecksView />
        </Row>
      </Col>
    );
  }
}
