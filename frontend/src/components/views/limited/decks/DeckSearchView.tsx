import React from "react";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import DecksMultiView from "./DecksMultiView";
import Paginator from "../../../utils/Paginator";
import {FullDeck, PaginatedQueryResponse} from "../../../models/models";
import {getQueryParameter} from "../../../utils/utils";
import history from '../../../routing/history';


interface DeckSearchViewProps {
  location: any
}


interface DeckSearchViewState {
  filter: string
  filterInput: string
}


export default class DeckSearchView extends React.Component<DeckSearchViewProps, DeckSearchViewState> {

  constructor(props: null) {
    super(props);
    this.state = {
      filter: "",
      filterInput: getQueryParameter(this.props.location.search, 'query', ''),
    };
  }

  render() {
    const filter = getQueryParameter(this.props.location.search, 'query', '');
    return <Col>
      <Row>
        <input
          type="text"
          value={this.state.filterInput}
          onChange={event => this.setState({filterInput: event.target.value})}
          onKeyDown={
            event => {
              if (event.key == 'Enter') {
                history.push(`${this.props.location.pathname}?query=${this.state.filterInput}`)
              }
              return true;
            }
          }
        />
      </Row>
      <Paginator
        fetch={
          (offset, limit) => FullDeck.recent(
            offset,
            limit,
            filter,
          )
        }
        renderAdditionalInformation={
          (response: PaginatedQueryResponse<FullDeck>) => (
            response.queryExplained &&
            <span>{response.queryExplained}</span>
          )
        }
        renderBody={
          (decks: FullDeck[]) => <DecksMultiView decks={decks}/>
        }
        key={filter}
      />
    </Col>
  }

}