import axios from 'axios/index';
import React from 'react';

import {apiPath, Cubeable} from "../../models/models";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {Printing} from "../../models/models";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";

import PaginationBar from '../../utils/PaginationBar';
import {CubeableImage} from "../../images";
import Alert from "react-bootstrap/Alert";


interface SearchViewProps {
  handleCardClicked: (printing: Printing) => void
  handleSearchRequest?: ((query: string, orderBy: string, sortDirection: string, offset: number) => void) | undefined
  query: string
  orderBy: string
  sortDirection: string
  offset: number
  limit: number
}


interface SearchViewState {
  searchResults: Printing[]
  offset: number
  hits: number
  query: string
  orderBy: string
  sortDirection: string
  errorMessage: string | null
  queryExplained: string | null
}


class SearchView extends React.Component<SearchViewProps, SearchViewState> {

  public static defaultProps = {
    handleCardClicked: () => {
    },
    query: '',
    orderBy: 'name',
    sortDirection: 'ascending',
    offset: 0,
    limit: 50,
  };

  constructor(props: SearchViewProps) {
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
        }
      }
    ).then(
      response => {
        this.setState(
          {
            searchResults: response.data.results.map(
              (printing: any) => Printing.fromRemote(printing)
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
                <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                </tr>
                </thead>
                <tbody>
                {
                  this.state.searchResults.map(
                    (printing: Printing) => {
                      return <tr>
                        <td>
                          <CubeableImage
                            cubeable={printing}
                            sizeSlug="thumbnail"
                            onClick={this.props.handleCardClicked as (printing: Cubeable) => void}
                          />
                        </td>
                        <td>{printing.name}</td>
                      </tr>
                    }
                  )
                }
                </tbody>
              </Table>
            </Row>
        }
      </Col>
    </Container>

  }
}


export default SearchView;