import React from 'react';

import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";

import {range} from "./utils";
import PaginationBar from "./PaginationBar";
import {PaginatedResponse} from "../models/models";


interface PaginatorProps<T, A extends PaginatedResponse<T>> {
  fetch: (offset: number, limit: number) => Promise<A>
  renderBody: (items: T[]) => any
  renderAdditionalInformation?: ((response: A) => any) | null
}

interface PaginatorState<T, A extends PaginatedResponse<T>> {
  items: T[]
  offset: number
  hits: number
  pageSize: number
  loading: boolean
  response: A | null
  error: string | null
}


export default class Paginator<T, A extends PaginatedResponse<T>> extends React.Component<PaginatorProps<T, A>, PaginatorState<T, A>> {

  constructor(props: PaginatorProps<T, A>) {
    super(props);
    this.state = {
      items: [],
      offset: 0,
      hits: 0,
      pageSize: 10,
      loading: false,
      response: null,
      error: null,
    };
  }

  componentDidMount() {
    this.refresh();
  }

  refresh = (): void => {
    this.fetch(this.state.offset);
  }

  fetch = (offset: number = 0): void => {
    this.setState(
      {loading: true, error: null},
      () => this.props.fetch(offset, this.state.pageSize).then(
        (response) => {
          this.setState(
            {
              items: response.objects,
              hits: response.hits,
              offset: offset,
              response,
              loading: false,
            }
          )
        }
      ).catch(
        () => this.setState({loading: false, error: 'Invalid query'})
      )
    )
  };

  render() {
    return <Container fluid>
      {
        this.props.renderAdditionalInformation && this.state.response && <Row>
          {this.props.renderAdditionalInformation(this.state.response)}
        </Row>
      }
      <Row>
        <PaginationBar
          hits={this.state.hits}
          offset={this.state.offset}
          handleNewOffset={this.fetch}
          pageSize={this.state.pageSize}
          maxPageDisplay={7}
        />
      </Row>
      {
        this.state.error ? <span>{this.state.error}</span> : <>
          <Row>
        <span>
            {
              this.state.loading ? 'loading...' : `Showing ${
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
        </>
      }
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
              v => <option value={v} key={v}>{v}</option>
            )
          }
        </select>
      </Row>
    </Container>;
  }

}
