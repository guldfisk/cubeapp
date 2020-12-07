import React from 'react';

import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import {Modal} from "react-bootstrap";
import DeckTextView from "./DeckTextView";
import DeckImageView from "./DeckImageView";
import {
  Cubeable,
  CubeablesContainer,
  Deck,
  LimitedSessionName,
  User
} from "../../../models/models";
import {DateListItem} from "../../../utils/listitems";

import '../../../../styling/DeckView.css';
import {Link} from "react-router-dom";
import CubeablesCollectionSpoilerView from "../../cubeablescollectionview/CubeablesCollectionSpoilerView";


interface DeckExportDialogProps {
  deck: Deck
  close: () => void
  show: boolean
  code?: string
}


interface DeckExportDialogState {
  extension: string;
}


class DeckExportDialog extends React.Component<DeckExportDialogProps, DeckExportDialogState> {

  constructor(props: DeckExportDialogProps) {
    super(props);
    this.state = {
      extension: 'cod',
    }
  }

  render() {
    return <Modal
      show={this.props.show}
    >
      <Modal.Header closeButton>
        <Modal.Title>Export</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <select
          value={this.state.extension}
          onChange={(event: any) => this.setState({extension: event.target.value})}
        >
          <option value="dec">.dec</option>
          <option value="mwDeck">.mwDeck</option>
          <option value="json">.json</option>
          <option value="cod">.cod</option>
        </select>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => this.props.close()}>Cancel</Button>
        <Button
          variant="primary"
          onClick={
            () => {
              this.props.close();
              this.props.deck.download(
                this.state.extension,
                this.props.code,
              );
            }
          }
        >
          Download
        </Button>
      </Modal.Footer>
    </Modal>
  }

}

interface DeckViewProps {
  deck: Deck;
  user: User;
  limitedSession?: LimitedSessionName;
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
  noHover?: boolean;
  code?: string;
}


interface DeckViewState {
  exporting: boolean;
  viewType: string;
  sampleHand: null | CubeablesContainer;
}


export default class DeckView extends React.Component<DeckViewProps, DeckViewState> {

  constructor(props: DeckViewProps) {
    super(props);
    this.state = {
      exporting: false,
      viewType: 'Images',
      sampleHand: null,
    }
  }

  render() {

    return <>
      <DeckExportDialog
        deck={this.props.deck}
        close={() => this.setState({exporting: false})}
        show={this.state.exporting}
        code={this.props.code}
      />
      <Card
        style={
          {
            width: '100%'
          }
        }
      >
        <Card.Header
          className="d-flex justify-content-between panel-heading"
        >
          <span className="header-item">
            <Link
              to={'/pools/' + this.props.deck.poolId + '/'}
            >
          {this.props.deck.name}
        </Link>
          </span>
          <span className="header-item">{this.props.user.username}</span>
          <span
            className="header-item"
          >
            <DateListItem date={this.props.deck.createdAt}/>
          </span>
          {
            this.props.limitedSession
            && <Link
              to={'/limited/' + this.props.limitedSession.id + '/'}
            >
              {this.props.limitedSession.name}
            </Link>
          }
          <select
            className="ml-auto"
            value={this.state.viewType}
            onChange={
              event => this.setState({viewType: event.target.value})
            }
          >
            <option>List</option>
            <option>Images</option>
          </select>
          <Button
            onClick={
              () => this.props.deck.sampleHand(this.props.code)
                .then((sampleHand) => this.setState({sampleHand}))
            }
          >
            Sample Hand
          </Button>
          <Button
            onClick={() => this.setState({exporting: true})}
          >
            Export
          </Button>
        </ Card.Header>
        < Card.Body>
          {
            this.state.sampleHand && <CubeablesCollectionSpoilerView
              cubeablesContainer={this.state.sampleHand}
              cubeableType="Cubeables"
              sizeSlug="small"
            />
          }
          < Container
            fluid
          >
            {
              this.state.viewType === 'List' ?
                <DeckTextView
                  deck={this.props.deck}
                  noHover={this.props.noHover}
                />
                : <DeckImageView
                  deck={this.props.deck}
                />
            }

          </Container>
        </Card.Body>
      </ Card>
    </>
  }
};
