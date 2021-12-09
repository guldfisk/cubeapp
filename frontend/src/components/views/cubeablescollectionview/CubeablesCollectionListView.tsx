import React from 'react';

import Row from 'react-bootstrap/Row';

import ListGroup from "react-bootstrap/ListGroup";
import Container from "react-bootstrap/Container";

import {alphabeticalPropertySortMethodFactory} from "../../utils/utils";
import {CubeablesContainer, Cubeable, PrintingCounter} from "../../models/models";
import {ImageableListItem} from "../../utils/listitems";


interface RawCubeListViewProps {
  rawCube: CubeablesContainer
  cubeableType: string
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
  noHover?: boolean
  noGarbage?: boolean
  allowStaticImages: boolean
}

export default class CubeablesCollectionListView extends React.Component<RawCubeListViewProps> {

  static defaultProps = {
    allowStaticImages: true,
  };

  render() {
    const printingCounter = (
      this.props.cubeableType === 'Cubeables' ?
        this.props.rawCube.printings
        : PrintingCounter.collectFromIterable(
        this.props.rawCube.allPrintings()
        )
    );

    const groups: [[string, string], IterableIterator<[Cubeable, number]>][] = [
      [
        ["yellow", "White"],
        printingCounter.printings_of_color('W'),
      ],
      [
        ["blue", "Blue"],
        printingCounter.printings_of_color('U'),
      ],
      [
        ["black", "Black"],
        printingCounter.printings_of_color('B'),
      ],
      [
        ["red", "Red"],
        printingCounter.printings_of_color('R'),
      ],
      [
        ["green", "Green"],
        printingCounter.printings_of_color('G'),
      ],
      [
        ["orange", "Gold"],
        printingCounter.gold_printings(),
      ],
      [
        ["grey", "Colorless"],
        printingCounter.colorless_printings(),
      ],
      [
        ["brown", "Lands"],
        printingCounter.land_printings(),
      ],
    ];

    if (this.props.cubeableType === 'Cubeables') {
      groups.push(
        [
          ["purple", "Traps"],
          this.props.rawCube.traps_of_intention_types(['SYNERGY', 'NO_INTENTION']),
        ]
      );
      if (!this.props.noGarbage) {
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
          this.props.rawCube.tickets.items(),
        ]
      );
      groups.push(
        [
          ["purple", "Purples"],
          this.props.rawCube.purples.items(),
        ]
      );
    }

    return <Container fluid>
      <Row>
        {
          groups.map(
            ([header, items]): [[string, string], [Cubeable, number][]] => {
              return [
                header,
                Array.from(items).sort(
                  alphabeticalPropertySortMethodFactory(
                    ([cubeable, _]: [Cubeable, number]) => cubeable.getSortValue()
                  )
                )
              ]
            }
          ).filter(
            ([, items]) => items.length
          ).map(
            ([[color, title], items], idx) => {
              return <ListGroup variant="flush" key={idx}>
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
                    ([cubeable, multiplicity], idx) => <ImageableListItem
                      key={idx}
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
