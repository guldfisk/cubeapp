import React from 'react';

import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";

import {range} from "./utils";
import PaginationBar from "./PaginationBar";
import {PaginatedResponse} from "../models/models";


interface PaginatorProps<T> {
  fetch: (offset: number, limit: number) => Promise<PaginatedResponse<T>>
  renderBody: (items: T[]) => any
}

interface PaginatorState<T> {
  items: T[]
  offset: number
  hits: number
  pageSize: number

}


export default class Paginator<T> extends React.Component<PaginatorProps<T>, PaginatorState<T>> {

  constructor(props: PaginatorProps<T>) {
    super(props);
    this.state = {
      items: [],
      offset: 0,
      hits: 0,
      pageSize: 10,
    };
  }

  componentDidMount() {
    this.refresh();
  }

  refresh = (): void => {
    this.fetch(this.state.offset);
  }

  fetch = (offset: number = 0): void => {
    this.props.fetch(offset, this.state.pageSize).then(
      ({objects, hits}) => {
        this.setState(
          {
            items: objects,
            hits,
            offset,
          }
        )
      }
    );
  };

  render() {
    return <Container fluid>
      <Row>
        <PaginationBar
          hits={this.state.hits}
          offset={this.state.offset}
          handleNewOffset={this.fetch}
          pageSize={this.state.pageSize}
          maxPageDisplay={7}
        />
      </Row>
      <Row>
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
      </Row>
      <Row>
        {this.props.renderBody(this.state.items)}
      </Row>
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
    </Container>;
  }

}
