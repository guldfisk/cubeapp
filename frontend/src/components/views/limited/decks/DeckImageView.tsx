import React from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import {Cubeable, Deck} from "../../../models/models";
import {ImageableImage} from "../../../images";
import {alphabeticalPropertySortMethodFactory} from "../../../utils/utils";

import '../../../../styling/stack.css';
import {PrintingsTooltip, TrapTooltip} from "../../../utils/listitems";


class Stack extends React.Component {

  render() {
    return <div
      className="stack-wrapper"
    >
      <div
        className="stack"
      >
        {this.props.children}
      </div>
    </div>
  }

}


class Stacked extends React.Component {

  render() {
    return <div
      className="stacked"
    >
      {this.props.children}
    </div>
  }
}


interface CardContainerProps {
  deck: Deck;
  onCubeableClicked?: (cubeable: Cubeable, amount: number) => void
  noHover?: boolean
}


export default class DeckImageView extends React.Component<CardContainerProps> {

  render() {
    return <Row>
      <PrintingsTooltip/>
      <TrapTooltip/>
      {
        this.props.deck.maindeck.cmcGroupedPrintings().map(
          printings => <Col>
            <Stack>
              {
                printings.map(
                  printing => <Stacked>
                    <ImageableImage
                      imageable={printing}
                      sizeSlug="small"
                      hover={true}
                    />
                  </Stacked>
                )
              }
            </Stack>
          </Col>
        )
      }
      <Col
        className="col-md-auto"
      >
        <Stack>
          {
            Array.from(this.props.deck.sideboard.iter()).sort(
              alphabeticalPropertySortMethodFactory(p => p.name)
            ).map(
              printing => <Stacked>
                <ImageableImage
                  imageable={printing}
                  sizeSlug="small"
                  hover={true}
                />
              </Stacked>
            )
          }
        </Stack>
      </Col>
    </Row>
  }

}