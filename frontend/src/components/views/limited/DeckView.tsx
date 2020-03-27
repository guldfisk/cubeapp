import React from 'react';

import axios from 'axios';

import fileDownload from 'js-file-download';

import Row from 'react-bootstrap/Row';
import ListGroup from "react-bootstrap/ListGroup";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import {Modal} from "react-bootstrap";

import {alphabeticalPropertySortMethodFactory} from "../../utils/utils";
import {Cubeable, Deck, Printing} from "../../models/models";
import {PrintingListItem} from "../../utils/listitems";


interface DeckExportDialogProps {
  deck: Deck
  close: () => void
  show: boolean
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
              this.props.deck.download(this.state.extension);
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
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
  noHover?: boolean
}


interface DeckViewState {
  exporting: boolean;
}

const groupings: [string, string[]][] = [
  ['Lands', ['Land']],
  ['Creatures', ['Creature']],
  ['Instants & Sorceries', ['Instant', 'Sorcery']],
];


export default class DeckView extends React.Component<DeckViewProps, DeckViewState> {

  constructor(props: DeckViewProps) {
    super(props);
    this.state = {
      exporting: false,
    }
  }

  render() {
    const groups = this.props.deck.maindeck.type_grouped_printings(
      groupings,
      'Non-Creature Permanents',
    );

    groups.push(
      [
        'Sideboard',
        Array.from(this.props.deck.sideboard.items()),
      ]
    );

    return <>
      <DeckExportDialog
        deck={this.props.deck}
        close={() => this.setState({exporting: false})}
        show={this.state.exporting}
      />
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
          {this.props.deck.name}
          <Button
            onClick={() => this.setState({exporting: true})}
          >
            Export
          </Button>
        </ Card.Header>
        < Card.Body>
          < Container
            fluid>
            < Row>
              {
                groups.map(
                  ([header, items]): [string, [Printing, number][]] => {
                    return [
                      header,
                      Array.from(items).sort(
                        alphabeticalPropertySortMethodFactory(
                          ([printing, _]: [Printing, number]) => printing.getSortValue()
                        )
                      )
                    ]
                  }
                ).filter(
                  ([header, items]) => items.length
                ).map(
                  ([title, items]) => {
                    return <ListGroup
                      variant="flush"
                      style={
                        {
                          margin: '20px',
                        }
                      }
                    >
                      <ListGroup.Item className="py-2">
                      <span>
                        {
                          title
                          + '\t'
                          + items.reduce(
                            (previous, [_, multiplicity]) => previous + multiplicity,
                            0,
                          )
                        }
                      </span>
                      </ListGroup.Item>
                      {
                        items.map(
                          ([printing, multiplicity]) => <PrintingListItem
                            printing={printing}
                            multiplicity={multiplicity}
                            onClick={this.props.onCubeableClicked}
                            noHover={this.props.noHover}
                          />
                        )
                      }
                    </ListGroup>
                  }
                )
              }
            </Row>
          </Container>
        </Card.Body>
      </ Card>
    </>
  }
};
