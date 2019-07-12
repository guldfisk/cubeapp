import axios from 'axios/index';
import React from 'react';

import {apiPath} from "../../models/models";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {Printing} from "../../models/models";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";


interface SearchViewProps {

}

interface SearchViewState {
  searchResults: Printing[]
}

class SearchView extends React.Component<SearchViewProps, SearchViewState> {

  constructor(props: any) {
    super(props);
    this.state = {
      searchResults: [],
    }
  }


  performSearch = (query: string, orderBy: string, sortDirection: string) => {
    this.setState(
      {
        searchResults: [],
      }
    );
    axios.get(
      apiPath + 'search/',
      {
        params: {
          query,
          order_by: orderBy,
          descending: sortDirection === "descending",
        }
      }
    ).then(
      response => {
        this.setState(
          {
            searchResults: response.data.results.map(
              (printing: any) => new Printing(printing)
            ),
          }
        )
      }
    )
  };

  userSubmit = (event: any) => {
    this.performSearch(
      event.target.elements.query.value,
      event.target.elements.orderBy.value,
      event.target.elements.sortDirection.value,
    );
    event.preventDefault();
    event.stopPropagation();
  };


  render() {
    console.log(this.state.searchResults);
    return <Container fluid>
      <Col>
        <Row>

          <Form
            onSubmit={this.userSubmit}
          >

            <Form.Row>

              <Form.Group
                controlId="query"
              >
                <Form.Control type="text"/>
              </Form.Group>

              <Form.Group
                controlId="orderBy"
              >
                <Form.Control as="select">
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
                <Form.Control as="select">
                  <option value="descending">Descending</option>
                  <option value="ascending">Ascending</option>
                </Form.Control>
              </Form.Group>

            </Form.Row>

          </Form>

        </Row>

        <Row>
          <Table>
            <thead>
            <tr>
              <th>Name</th>
              <th>Id</th>
            </tr>
            </thead>
            <tbody>
            {
              this.state.searchResults.map(
                (printing: Printing) => {
                  return <tr>
                    <td>{printing.name()}</td>
                    <td>{printing.id()}</td>
                  </tr>
                }
              )
            }
            </tbody>
          </Table>
        </Row>
      </Col>
    </Container>

  }
}


export default SearchView;