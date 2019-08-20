import React from 'react';
import {ReactElement} from 'react';

import Row from 'react-bootstrap/Row';

import {CubeablesContainer, PrintingCollection, Cubeable} from "../../models/models";
import {CubeableListItem} from "../../utils/listitems";
import ListGroup from "react-bootstrap/ListGroup";
import Container from "react-bootstrap/Container";


interface RawCubeListViewProps {
  rawCube: CubeablesContainer
  cubeableType: string
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
  noHover?: boolean
  noGarbage?: boolean
}

export default class CubeablesCollectionListView extends React.Component<RawCubeListViewProps> {

  render() {
    const printingCollection = (
      this.props.cubeableType === 'Cubeables' ?
        this.props.rawCube.printings
        : PrintingCollection.collectFromIterable(
        this.props.rawCube.allPrintings()
        )
    );

    const groups: [[string, string], [Cubeable, number][]][] = [
      [
        ["yellow", "White"],
        printingCollection.printings_of_color('W'),
      ],
      [
        ["blue", "Blue"],
        printingCollection.printings_of_color('U'),
      ],
      [
        ["black", "Black"],
        printingCollection.printings_of_color('B'),
      ],
      [
        ["red", "Red"],
        printingCollection.printings_of_color('R'),
      ],
      [
        ["green", "Green"],
        printingCollection.printings_of_color('G'),
      ],
      [
        ["orange", "Gold"],
        printingCollection.gold_printings(),
      ],
      [
        ["grey", "Colorless"],
        printingCollection.colorless_printings(),
      ],
      [
        ["brown", "Lands"],
        printingCollection.land_printings(),
      ],
    ];

    if (this.props.cubeableType === 'Cubeables') {
      groups.push(
        [
          ["purple", "Traps"],
          this.props.rawCube.traps_of_intention_types(['SYNERGY', 'NO_INTENTION']),
        ]
      );
      if (this.props.noHover === undefined || !this.props.noHover) {
        groups.push(
          [
            ["purple", "Garbage Traps"],
            this.props.rawCube.traps_of_intention_types(['GARBAGE']),
          ]
        );
      }
      groups.push(
        [
          ["purple", "Ors"],
          this.props.rawCube.traps_of_intention_types(['OR']),
        ]
      );
      groups.push(
        [
          ["pink", "Tickets"],
          this.props.rawCube.tickets.items,
        ]
      );
      groups.push(
        [
          ["purple", "Purples"],
          this.props.rawCube.purples.items,
        ]
      );
    }

    return <Container fluid>
      <Row>
        {
          groups.filter(
            ([header, items]) => items.length
          ).map(
            ([[color, title], items]) => {
              return <ListGroup variant="flush">
                <ListGroup.Item className="py-2">
                  <span
                    style={{color: color}}
                  >
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
                    ([cubeable, multiplicity]) => <CubeableListItem
                      cubeable={cubeable}
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
  }
}
