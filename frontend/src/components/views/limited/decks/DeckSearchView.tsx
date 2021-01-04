import React from "react";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import PaginationBar from "../../../utils/PaginationBar";
import {FullDeck} from "../../../models/models";
import {range} from "../../../utils/utils";
import DecksMultiView from "./DecksMultiView";


interface DeckSearchViewProps {
}


interface DeckSearchViewState {
  decks: FullDeck[]
  offset: number
  hits: number
  filter: string
  filterInput: string
  pageSize: number
}


export default class DeckSearchView extends React.Component<DeckSearchViewProps, DeckSearchViewState> {

  constructor(props: null) {
    super(props);
    this.state = {
      decks: [],
      offset: 0,
      hits: 0,
      filter: "",
      filterInput: "",
      pageSize: 10,
    };
  }

  componentDidMount() {
    this.fetch();
  }

  fetch = (offset: number = 0) => {
    FullDeck.recent(
      offset,
      this.state.pageSize,
      this.state.filter,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            decks: objects,
            hits,
            offset,
          }
        )
      }
    );
  };

  render() {
    return <Col>
      <Row>
        <PaginationBar
          hits={this.state.hits}
          offset={this.state.offset}
          handleNewOffset={this.fetch}
          pageSize={this.state.pageSize}
          maxPageDisplay={7}
        />
        <input
          type="text"
          value={this.state.filterInput}
          onChange={event => this.setState({filterInput: event.target.value})}
          onKeyDown={
            event => {
              if (event.key == 'Enter') {
                this.setState({filter: this.state.filterInput}, this.fetch);
              }
              return true;
            }
          }
        />
      </Row>
      <span>
        {
          `Showing ${
            this.state.offset
          } - ${
            Math.min(this.state.offset + this.state.pageSize, this.state.hits)
          } out of ${
            this.state.hits
          } results.`
        }
      </span>
      <DecksMultiView decks={this.state.decks}/>
      <Row>
        <PaginationBar
          hits={this.state.hits}
          offset={this.state.offset}
          handleNewOffset={this.fetch}
          pageSize={this.state.pageSize}
          maxPageDisplay={7}
        />
        <select
          name="pageSize"
          value={this.state.pageSize}
          onChange={
            event => this.setState(
              {pageSize: parseInt(event.target.value)},
              () => this.fetch(this.state.offset),
            )
          }
        >
          {
            Array.from(range(5, 35, 5)).map(
              v => <option value={v}>{v}</option>
            )
          }
        </select>
      </Row>
    </Col>
  }

}