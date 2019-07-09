import axios from 'axios/index';
import React from 'react';

import queryString from 'query-string';

import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import {get_cubeable_images_url} from '../utils.jsx';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";


class SearchPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      searchResults: null,
      inputValue: '',
    }
  }

  initSearch = (queries) => {
    if (!queries) {return}

    const _map = {
      query: 'query',
      order_by: 'order_by',
      descending: 'descending',
      search_target: 'search_target',
    };

    const parameters  = queryString.parse(queries).entries().reduce(
      (pair, collector) => {
        if (_map[pair[0] === undefined]) {
          collector.append(decodeURIComponent(pair[1]))
        }
      },
      []
    );

    this.setState(
      {
        inputValue: decodedValue,
      }
    );
    this.performSearch(decodedValue);

  };

  componentDidMount() {
    this.initSearch(this.props.match.location.search);
  }

  componentWillReceiveProps(nextProps) {
    this.initSearch(nextProps.match.location.search);
  }

  performSearch = (query) => {
    // this.setState(
    //   {
    //     searchResults: null,
    //   }
    // );
    // axios.get(
    //   get_api_path() + 'search/',
    //   {
    //     params: {
    //       query,
    //     }
    //   }
    // ).then(
    //   response => {
    //     this.setState(
    //       {
    //         searchResults: response.data,
    //       }
    //     )
    //   }
    // )
  };

  userSubmit = (event) => {
    if (!event) event = window.location;
    const keyCode = event.keyCode || event.which;
    if (keyCode === 13) {
      this.props.history.push('/search/' + this.state.inputValue);
      return false;
    }
  };

  inputChanged = (event) => {
    this.setState(
      {
        inputValue: event.target.value,
      }
    )
  };

  render() {

    return <Container fluid>
      <Col>
        <Row>
          <Col>
            <input type="text" value={this.state.inputValue} onKeyPress={this.userSubmit} onChange={this.inputChanged}/>
            <select>
              <option>Name</option>
              <option>Cmc</option>
              <option>Power</option>
              <option>Toughness</option>
              <option>Loyalty</option>
              <option>Artist Name</option>
              <option>Release Date</option>
            </select>
          </Col>
          <Col>
            <input type="text"/>
          </Col>
        </Row>
        <Row>
          {
            this.state.searchResults !== null ? this.state.searchResults.results.map(
              result => <img
                src={get_cubeable_images_url(result.id, 'printing', 'medium')}
                alt={result.name}
              />
            ) : <div/>
          }
        </Row>
      </Col>
    </Container>

  }
}


export default SearchPage;