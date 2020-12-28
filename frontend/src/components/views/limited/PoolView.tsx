import React from 'react';

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

import DeckView from "./decks/DeckView";
import CubeablesCollectionListView from '../cubeablescollectionview/CubeablesCollectionListView';
import {Pool} from "../../models/models";
import CubeablesCollectionSpoilerView from "../cubeablescollectionview/CubeablesCollectionSpoilerView";


interface PoolViewProps {
  pool: Pool
  code?: string
}

interface PoolViewState {
  shareLink: string
  viewType: string;
}


export default class PoolView extends React.Component<PoolViewProps, PoolViewState> {

  constructor(props: PoolViewProps) {
    super(props);
    this.state = {
      shareLink: '',
      viewType: 'List',
    }
  }

  render() {
    return <Container
      fluid={true}
    >
      <Row>
        {
          this.props.pool.decks.length ?
            <DeckView
              deck={this.props.pool.decks[this.props.pool.decks.length - 1]}
              user={this.props.pool.user}
              code={this.props.code}
              limitedSession={this.props.pool.session}
            /> : null
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
            {
              this.state.shareLink ? <input
                className="ml-auto"
                type='text'
                value={this.state.shareLink}
                contentEditable={false}
              /> : <Button
                className="ml-auto"
                onClick={() => this.props.pool.share(this.props.code).then(link => this.setState({shareLink: link}))}
              >
                share
              </Button>
            }
            <select
              value={this.state.viewType}
              onChange={
                event => this.setState({viewType: event.target.value})
              }
            >
              <option>List</option>
              <option>Images</option>
            </select>
            <a
              href='#'
              title="Export"
              onClick={() => this.props.pool.download(this.props.code)}
            >
              <Button>
                Export
              </Button>
            </a>
          </Card.Header>
          <Card.Body>
            {
              this.state.viewType === 'List' ?
                <CubeablesCollectionListView
                  rawCube={this.props.pool.pool}
                  cubeableType={'Cubeables'}
                />
                : <CubeablesCollectionSpoilerView
                  cubeableType={'Cubeables'}
                  cubeablesContainer={this.props.pool.pool}
                />
            }
          </Card.Body>
        </ Card>
      </Row>
    </Container>

  }
}
