import React from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import {Cubeable, Deck} from "../../../models/models";
import {ImageableImage} from "../../../images";
import {alphabeticalPropertySortMethodFactory} from "../../../utils/utils";

import '../../../../styling/stack.css';


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
      {
        this.props.deck.maindeck.cmcGroupedPrintings().map(
          (printings, idx) => <Col key={idx}>
            <Stack>
              {
                printings.map(
                  (printing, idx) => <Stacked key={idx}>
                    <ImageableImage
                      imageable={printing}
                      sizeSlug="small"
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
              (printing, idx) => <Stacked key={idx}>
                <ImageableImage
                  imageable={printing}
                  sizeSlug="small"
                />
              </Stacked>
            )
          }
        </Stack>
      </Col>
    </Row>
  }

}