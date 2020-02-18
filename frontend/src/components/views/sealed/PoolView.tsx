import React from 'react';

import CubeablesCollectionListView from '../cubeablescollectionview/CubeablesCollectionListView';
import {SealedPool} from "../../models/models";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import DeckView from "./DeckView";
import Card from "react-bootstrap/Card";


interface PoolViewProps {
  pool: SealedPool
}


export default class PoolView extends React.Component<PoolViewProps> {

  render() {
    return <Container
      fluid={true}
    >
      <Row>
        {
          this.props.pool.decks.length > 0 && <DeckView deck={this.props.pool.decks[this.props.pool.decks.length - 1]}/>
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
          <Card.Header>
            Pool
          </Card.Header>
          <Card.Body>
            <CubeablesCollectionListView
              rawCube={this.props.pool.pool}
              cubeableType={'Cubeables'}
            />
          </Card.Body>
        </ Card>
        }

      </Row>
    </Container>

  }
}
