import React from "react";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import DraftPickSearchHitView from "./DraftPickSearchHitView";
import Paginator from "../../utils/Paginator";
import {DraftPickSearchHit} from "../../models/models";


interface DraftSearchViewProps {
  draftSessionId: string | number;
}


interface DraftSearchViewState {
  filter: string
  filterInput: string
}


export default class DraftSearchView extends React.Component<DraftSearchViewProps, DraftSearchViewState> {

  constructor(props: null) {
    super(props);
    this.state = {
      filter: "",
      filterInput: "",
    };
  }

  render() {
    return <Col>
      <Row>
        <input
          type="text"
          value={this.state.filterInput}
          placeholder="Search picks"
          onChange={event => this.setState({filterInput: event.target.value})}
          onKeyDown={
            event => {
              if (event.key == 'Enter') {
                this.setState({filter: this.state.filterInput});
              }
              return true;
            }
          }
        />
        <Paginator
          key={this.state.filter}
          fetch={
            (offset, limit) => this.state.filter ? DraftPickSearchHit.search(
              this.props.draftSessionId,
              this.state.filter,
              offset,
              limit,
            ) : Promise.resolve({objects: [], hits: 0})
          }
          renderBody={
            (hits: DraftPickSearchHit[]) => hits.map(
              (hit, idx) => <DraftPickSearchHitView key={idx} hit={hit}/>
            )
          }
        />
      </Row>
    </Col>
  }

}