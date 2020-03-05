import React from 'react';

import Row from 'react-bootstrap/Row';

import ListGroup from "react-bootstrap/ListGroup";
import Container from "react-bootstrap/Container";

import {alphabeticalPropertySortMethodFactory} from "../../utils/utils";
import {Cubeable, Deck, Printing} from "../../models/models";
import {PrintingListItem} from "../../utils/listitems";
import Card from "react-bootstrap/Card";


interface DeckViewProps {
  deck: Deck;
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
  noHover?: boolean
}


const groupings: [string, string[]][] = [
  ['Lands', ['Land']],
  ['Creatures', ['Creature']],
  ['Instants & Sorceries', ['Instant', 'Sorcery']],
];


export default class DeckView extends React.Component<DeckViewProps> {

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

    return <Card
      style={
        {
          width: '100%'
        }
      }
    >
      <Card.Header>
        {this.props.deck.name}
      </Card.Header>
      <Card.Body>
        <Container fluid>
          <Row>
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
    </ Card>;
  }
}
