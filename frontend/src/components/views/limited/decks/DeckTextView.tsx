import React from "react";
import Row from "react-bootstrap/Row";
import {Cubeable, Deck, Printing} from "../../../models/models";
import {alphabeticalPropertySortMethodFactory} from "../../../utils/utils";
import ListGroup from "react-bootstrap/ListGroup";
import {PrintingListItem} from "../../../utils/listitems";


const groupings: [string, string[]][] = [
  ['Lands', ['Land']],
  ['Creatures', ['Creature']],
  ['Instants & Sorceries', ['Instant', 'Sorcery']],
];


interface DeckTextViewProps {
  deck: Deck;
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
  noHover?: boolean
}


export default class DeckTextView extends React.Component<DeckTextViewProps> {

  render() {
    const groups = this.props.deck.maindeck.typeGroupedPrintings(
      groupings,
      'Non-Creature Permanents',
    );

    groups.push(
      [
        'Sideboard',
        Array.from(this.props.deck.sideboard.items()),
      ]
    );

    return < Row>
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
  }
}