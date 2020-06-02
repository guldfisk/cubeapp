import React from 'react';

import CubeablesCollectionListView from '../cubeablescollectionview/CubeablesCollectionListView';
import {Pool} from "../../models/models";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import DeckView from "./decks/DeckView";


interface PoolViewProps {
  pool: Pool
}


export default class PoolView extends React.Component<PoolViewProps> {

  render() {
    return <Container
      fluid={true}
    >
      <Row>
        {
          this.props.pool.deck &&
          <DeckView
            deck={this.props.pool.deck}
            user={this.props.pool.user}
          />
        }
      </Row>
      <Row>
        <Card
          style={
            {
              width: '100%'
            }
          }
        >
          <Card.Header
            className="d-flex justify-content-between"

          >
            Pool
            <a
              href='#'
              title="Export"
              onClick={() => this.props.pool.download()}
            >
              <Button>
                Export
              </Button>
            </a>
          </Card.Header>
          <Card.Body>
            <CubeablesCollectionListView
              rawCube={this.props.pool.pool}
              cubeableType={'Cubeables'}
            />
          </Card.Body>
        </ Card>
      </Row>
    </Container>

  }
}
