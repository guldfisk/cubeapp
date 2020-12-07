import React from 'react';

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import DeckView from "./decks/DeckView";
import CubeablesCollectionListView from '../cubeablescollectionview/CubeablesCollectionListView';
import {Pool} from "../../models/models";


interface PoolViewProps {
  pool: Pool
  code?: string
}

interface PoolViewState {
  shareLink: string
}


export default class PoolView extends React.Component<PoolViewProps, PoolViewState> {

  constructor(props: PoolViewProps) {
    super(props);
    this.state = {
      shareLink: '',
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
          />: null
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
                type='text'
                value={this.state.shareLink}
                contentEditable={false}
              /> : <Button
                onClick={() => this.props.pool.share(this.props.code).then(link => this.setState({shareLink: link}))}
              >
                share
              </Button>
            }
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
