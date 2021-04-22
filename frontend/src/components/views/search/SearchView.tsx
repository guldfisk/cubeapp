import axios from 'axios/index';
import React from 'react';

import {apiPath, Cardboard, Imageable} from "../../models/models";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {Printing} from "../../models/models";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";

import PaginationBar from '../../utils/PaginationBar';
import {ImageableImage} from "../../images";
import Alert from "react-bootstrap/Alert";
import {ImageableListItem} from "../../utils/listitems";


interface SearchViewProps<T> {
  handleCubeableClicked?: (card: T) => void
  handleSearchRequest?: ((query: string, orderBy: string, sortDirection: string, offset: number) => void) | undefined
  query?: string
  orderBy?: string
  sortDirection?: string
  offset?: number
  limit?: number
  resultView?: string
}


interface SearchViewState<T> {
  searchResults: T[]
  offset: number
  hits: number
  query: string
  orderBy: string
  sortDirection: string
  errorMessage: string | null
  queryExplained: string | null
}


class SearchView<T extends Printing | Cardboard> extends React.Component<SearchViewProps<T>, SearchViewState<T>> {

  public static defaultProps = {
    handleCardClicked: () => {},
    query: '',
    orderBy: 'name',
    sortDirection: 'ascending',
    offset: 0,
    limit: 50,
    resultView: 'images',
  };

  constructor(props: SearchViewProps<T>) {
    super(props);
    this.state = {
      searchResults: [],
      offset: props.offset,
      hits: 0,
      query: props.query,
      orderBy: props.orderBy,
      sortDirection: props.sortDirection,
      errorMessage: null,
      queryExplained: null,
    }
  }

  newSearch = (
    query: string,
    orderBy: string,
    sortDirection: string,
    offset: number,
  ) => {
    this.setState(
      {query, orderBy, sortDirection, offset},
      () => {
        this.internalPerformSearch(query, orderBy, sortDirection, offset)
      }
    )
  };

  getCubeableType = (): typeof Printing | typeof Cardboard => {
    return Printing
  };

  getSearchTarget = (): string => {
    return 'printings'
  };

  internalPerformSearch = (
    query: string,
    orderBy: string,
    sortDirection: string,
    offset: number,
  ) => {
    this.setState(
      {
        searchResults: [],
        hits: 0,
        offset: 0,
      }
    );
    axios.get(
      apiPath + 'search/',
      {
        params: {
          query,
          order_by: orderBy,
          descending: sortDirection === "descending",
          offset,
          limit: this.props.limit,
          search_target: this.getSearchTarget(),
        }
      }
    ).then(
      response => {
        this.setState(
          {
            searchResults: response.data.results.map(
              (cubeable: any) => this.getCubeableType().fromRemote(cubeable)
            ),
            hits: response.data.count,
            offset,
            errorMessage: null,
            queryExplained: response.data.query_explained,
          },
        );
      }
    ).catch(
      error => {
        this.setState({errorMessage: error.response.data.toString()});
      }
    )
  };

  performSearch = (
    query: string,
    orderBy: string,
    sortDirection: string,
    offset: number,
  ) => {
    if (this.props.handleSearchRequest) {
      this.props.handleSearchRequest(query, orderBy, sortDirection, offset);
    } else {
      this.internalPerformSearch(query, orderBy, sortDirection, offset);
    }
  };

  userSubmit = (event: any) => {
    this.performSearch(
      this.state.query,
      this.state.orderBy,
      this.state.sortDirection,
      0,
    );
    event.preventDefault();
    event.stopPropagation();
  };

  handleFormChange = (event: any) => {
    const name: string = event.target.name;
    const value: string = event.target.value;

    if (name === 'query') {
      this.setState({query: value})
    } else {
      this.setState(
        // @ts-ignore
        {[event.target.name]: event.target.value},
        () => {
          if (this.state.query !== "") {
            this.performSearch(
              this.state.query,
              this.state.orderBy,
              this.state.sortDirection,
              this.state.offset,
            );
          }
        },
      );
    }

  };

  handlePageChange = (offset: number) => {
    this.performSearch(
      this.state.query,
      this.state.orderBy,
      this.state.sortDirection,
      offset,
    );
  };

  render() {
    return <Container fluid>
      <Col>
        {
          !this.state.errorMessage ? undefined : <Alert
            variant="danger"
          >
            {this.state.errorMessage}
          </Alert>
        }
        <Row>
          <Form
            onSubmit={this.userSubmit}
          >

            <Form.Row>

              <Form.Group
                controlId="query"
              >
                <Form.Control
                  type="text"
                  name="query"
                  onChange={this.handleFormChange}
                  defaultValue={this.state.query}
                />
              </Form.Group>

              <Form.Group
                controlId="orderBy"
              >
                <Form.Control
                  as="select"
                  name="orderBy"
                  onChange={this.handleFormChange}
                  value={this.state.orderBy}
                >
                  <option value="name">Name</option>
                  <option value="cmc">Cmc</option>
                  <option value="power">Power</option>
                  <option value="toughness">Toughness</option>
                  <option value="loyalty">Loyalty</option>
                  <option value="artist">Artist Name</option>
                  <option value="release_date">Release Date</option>
                </Form.Control>
              </Form.Group>

              <Form.Group
                controlId="sortDirection"
              >
                <Form.Control
                  as="select"
                  name="sortDirection"
                  onChange={this.handleFormChange}
                  value={this.state.sortDirection}
                >
                  <option value="descending">Descending</option>
                  <option value="ascending">Ascending</option>
                </Form.Control>
              </Form.Group>

            </Form.Row>

          </Form>

        </Row>

        {
          this.state.queryExplained !== null ? <h4>{'where ' + this.state.queryExplained}</h4> : null
        }

        <Row>
          <span>
            {
              `Showing ${
                this.state.offset
                } - ${
                Math.min(this.state.offset + this.props.limit, this.state.hits)
                } out of ${
                this.state.hits
                } results.`
            }
          </span>
        </Row>

        <Row>
          {
            this.state.hits === 0 ? <div/> :
              <PaginationBar
                hits={this.state.hits}
                offset={this.state.offset}
                handleNewOffset={this.handlePageChange}
                maxPageDisplay={7}
                pageSize={this.props.limit}
              />
          }
        </Row>
        {
          !this.state.searchResults.length ? undefined :
            <Row>
              <Table>
                {
                  this.props.resultView === 'images' ?
                    <>
                      <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                      </tr>
                      </thead>
                      <tbody>
                      {
                        this.state.searchResults.map(
                          (cubeable: Printing | Cardboard) => {
                            return <tr>
                              <td>
                                <ImageableImage
                                  imageable={cubeable}
                                  sizeSlug="thumbnail"
                                  onClick={this.props.handleCubeableClicked as (cubeable: Imageable) => void}
                                  allowStatic={false}
                                />
                              </td>
                              <td>{cubeable.name}</td>
                            </tr>
                          }
                        )
                      }
                      </tbody>
                    </> :
                    <tbody>
                    {
                      this.state.searchResults.map(
                        (cubeable: Printing | Cardboard) => {
                          return <tr>
                            <td>
                              <ImageableListItem
                                cubeable={cubeable}
                                multiplicity={1}
                                onClick={
                                  (cubeable, multiplicity) => this.props.handleCubeableClicked(cubeable as T)
                                }
                              />
                            </td>
                          </tr>
                        }
                      )
                    }
                    </tbody>
                }
              </Table>
            </Row>
        }
      </Col>
    </Container>

  }
}


export class PrintingSearchView extends SearchView<Printing> {

}

export class CardboardSearchView extends SearchView<Cardboard> {

  getCubeableType = (): typeof Printing | typeof Cardboard => {
    return Cardboard
  };

  getSearchTarget = (): string => {
    return 'cardboards'
  };

}
