import React from 'react';

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import {connect} from "react-redux";
import {Link} from "react-router-dom";
import {Modal} from "react-bootstrap";

import CubeablesCollectionSpoilerView from "../../cubeablescollectionview/CubeablesCollectionSpoilerView";
import DeckImageView from "./DeckImageView";
import DeckTextView from "./DeckTextView";
import {Cubeable, CubeablesContainer, Deck, LimitedSessionName, TournamentRecord, User} from "../../../models/models";
import {DateListItem} from "../../../utils/listitems";

import '../../../../styling/DeckView.css';


interface DeckExportDialogProps {
  deck: Deck
  close: () => void
  show: boolean
  code?: string
  authenticated: boolean
}


interface DeckExportDialogState {
  extension: string;
}


class DeckExportDialog extends React.Component<DeckExportDialogProps, DeckExportDialogState> {

  constructor(props: DeckExportDialogProps) {
    super(props);
    this.state = {
      extension: 'dec',
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
          {this.props.authenticated && <option value="pdf">.pdf</option>}
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
  deck: Deck
  user: User
  limitedSession?: LimitedSessionName | null
  record?: TournamentRecord | null
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
  noHover?: boolean
  code?: string
  authenticated: boolean
}

interface DeckViewState {
  exporting: boolean
  viewType: string
  sampleHand: null | CubeablesContainer
}

class DeckView extends React.Component<DeckViewProps, DeckViewState> {

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
        authenticated={this.props.authenticated}
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
          {
            this.props.record && <span className="header-item">
              {this.props.record.asString()}
            </span>

          }
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
}


const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
  };
};


export default connect(mapStateToProps)(DeckView);
