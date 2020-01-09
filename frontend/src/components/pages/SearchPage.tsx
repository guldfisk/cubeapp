import React, {RefObject} from 'react';

import queryString from 'query-string';
import {PrintingSearchView} from "../views/search/SearchView";
import history from '../routing/history';


interface SearchPageProps {
  match: any
  location: any
}


interface SearchPageState {
}


export default class SearchPage extends React.Component<SearchPageProps, SearchPageState> {
  searchViewRef: RefObject<PrintingSearchView>;
  lastParams: { [p: string]: string };

  constructor(props: SearchPageProps) {
    super(props);
    this.searchViewRef = React.createRef();
    this.lastParams = {};

  }

  initSearch = (queries: any) => {
    if (!queries) {
      return
    }

    const _map: {[key: string]: string} = {
      query: "",
      orderBy: 'name',
      sortDirection: 'ascending',
      offset: "0",
    };

    for (const [key, value] of Object.entries(queryString.parse(queries))) {
      if (key in _map) {
          if (value instanceof Array) {
            _map[key] = decodeURIComponent(value[0])
          } else {
            _map[key] = decodeURIComponent(value)
          }
        }
    }

    if (
      this.lastParams.query == _map.query
      && this.lastParams.orderBy == _map.orderBy
      && this.lastParams.sortDirection == _map.sortDirection
      && this.lastParams.offset == _map.offset
    ) {
      return;
    }

    this.lastParams = _map;

    this.searchViewRef.current.newSearch(
      _map.query,
      _map.orderBy,
      _map.sortDirection,
      parseInt(_map.offset),
    );

  };

  handleSearchRequest = (query: string, orderBy: string, sortDirection: string, offset: number): void => {
    history.push(
      {
        pathname: this.props.match.path,
        search: "?" + new URLSearchParams(
          {
            query,
            orderBy,
            sortDirection,
            offset: offset.toString(),
          }
        ).toString()
      }
    );
  };

  componentDidUpdate(prevProps: Readonly<SearchPageProps>, prevState: Readonly<SearchPageState>, snapshot?: any): void {
    this.initSearch(this.props.location.search);
  }

  render() {
    return <PrintingSearchView
      ref={this.searchViewRef}
      handleSearchRequest={this.handleSearchRequest}
    />
  }
}
