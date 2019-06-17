import axios from 'axios';
import React from 'react';

import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import {get_api_path, get_cubeable_images_url} from './utils.jsx';


class SearchPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      searchResults: [],
      inputValue: '',
    }
  }

  initSearch = (query) => {
    if (query) {
      const decodedValue = decodeURIComponent(query);
      this.setState(
        {
          inputValue: decodedValue,
        }
      );
      this.performSearch(decodedValue);
    } else {
      this.setState(
        {
          inputValue: '',
          searchResults: [],
        }
      )
    }
  };

  componentDidMount() {
    this.initSearch(this.props.match.params.initialSearch);
  }

  componentWillReceiveProps(nextProps) {
    this.initSearch(nextProps.match.params.initialSearch);
  }

  performSearch = (query) => {
    this.setState(
          {
            searchResults: [],
          }
    );
    axios.get(
      get_api_path() + 'search/',
      {
        params: {
          query,
        }
      }
    ).then(
      response => {
        this.setState(
        {
          searchResults: response.data.results,
        }
      )
      }
    ).catch(
      () => {
        this.setState(
          {
            searchResults: [],
          }
        )
      }
    )
  };

  userSubmit = (event) => {
    if (!event) event = window.location;
    const keyCode = event.keyCode || event.which ;
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
    return (
      <div>
        <input type="text" value={this.state.inputValue} onKeyPress={this.userSubmit} onChange={this.inputChanged}/>
        <br/>
        {
          this.state.searchResults.map(
            result => <img
              src={get_cubeable_images_url(result.id, 'printing', 'medium')}
              alt={result.cardboard.name}
            />
          )
        }
      </div>
    )
  }

}


export default SearchPage;