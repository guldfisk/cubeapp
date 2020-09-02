import React from "react";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import PaginationBar from "../../../utils/PaginationBar";
import DecksSpoilerView from "./DecksSpoilerView";
import {FullDeck} from "../../../models/models";
import DecksTableView from "./DecksTableView";


const pageSize: number = 10;


interface DeckSearchViewState {
  decks: FullDeck[];
  offset: number
  hits: number
  filter: string
  filterInput: string
  viewType: string
}


interface DeckSearchViewProps {
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
      viewType: 'spoiler',
    };
  }

  componentDidMount() {
    this.fetch();
  }

  fetch = (offset: number = 0) => {
    FullDeck.recent(
      offset,
      pageSize,
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
          pageSize={pageSize}
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
        <select
          className="ml-auto"
          onChange={
            event => this.setState({viewType: event.target.value})
          }
          value={this.state.viewType}
        >
          <option value="spoiler">Spoiler</option>
          <option value="table">Table</option>
        </select>
      </Row>
      <span>
            {
              `Showing ${
                this.state.offset
                } - ${
                Math.min(this.state.offset + pageSize, this.state.hits)
                } out of ${
                this.state.hits
                } results.`
            }
          </span>
      {
        this.state.viewType == 'spoiler' ?
          <DecksSpoilerView
            decks={this.state.decks}
          /> :
          <DecksTableView decks={this.state.decks}/>
      }
      <PaginationBar
        hits={this.state.hits}
        offset={this.state.offset}
        handleNewOffset={this.fetch}
        pageSize={pageSize}
        maxPageDisplay={7}
      />
    </Col>
  }

}