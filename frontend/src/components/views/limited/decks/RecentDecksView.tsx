import {FullDeck} from "../../../models/models";
import React from "react";
import Col from "react-bootstrap/Col";
import PaginationBar from "../../../utils/PaginationBar";
import DecksView from "./DecksView";


const pageSize: number = 10;


interface RecentDecksViewState {
  decks: FullDeck[];
  offset: number
  hits: number
}


interface RecentDecksViewProps {
}


export default class RecentDecksView extends React.Component<RecentDecksViewProps, RecentDecksViewState> {

  constructor(props: null) {
    super(props);
    this.state = {
      decks: [],
      offset: 0,
      hits: 0,
    };
  }

  componentDidMount() {
    this.fetch(0);
  }

  fetch = (offset: number) => {
    FullDeck.recent(
      offset,
      pageSize,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            decks: objects,
            hits,
          }
        )
      }
    );
  };

  render() {

    return <Col>
      <PaginationBar
        hits={this.state.hits}
        offset={this.state.offset}
        handleNewOffset={this.fetch}
        pageSize={pageSize}
        maxPageDisplay={7}
      />
      <DecksView
        decks={this.state.decks}
      />
    </Col>
  }

}