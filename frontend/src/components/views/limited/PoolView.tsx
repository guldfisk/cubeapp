import React from 'react';

import CubeablesCollectionListView from '../cubeablescollectionview/CubeablesCollectionListView';
import {Pool} from "../../models/models";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import DeckView from "./DeckView";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";


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
          <Card.Header
            className="d-flex justify-content-between"

          >
            Pool
            <a
              href={this.props.pool.getDownloadUrl()}
              title="Export"
              download={"pool_" + this.props.pool.id + ".json"}
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
