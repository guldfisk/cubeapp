import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import {connect} from "react-redux";
import {Link} from "react-router-dom";

import DraftInfo from "./DraftInfo";
import DraftSearchView from "./DraftSearchView";
import {DraftSeat, DraftSession, User} from "../../models/models";


interface DraftViewProps {
  draft: DraftSession;
  authenticated: boolean;
  user: User | null;
}


class DraftView extends React.Component<DraftViewProps, null> {

  render() {

    const columns = [
        {
          dataField: 'id',
          text: 'ID',
          hidden: true,
        },
        {
          dataField: 'user',
          text: 'Seat',
          formatter: (cell: User) => cell.username,
        },
        {
          dataField: 'view',
          text: '',
          headerStyle: () => {
            return {width: '3em', textAlign: 'center'};
          },
          formatter: (cell: any, row: DraftSeat) => (
            this.props.draft.limitedSession && this.props.draft.limitedSession.publicPools()
            || this.props.authenticated && this.props.user.id == row.user.id
          ) && <Link
            to={'/seat/' + row.id + '/0/'}
          >
            view
          </Link>,
          isDummyField: true,
        },
      ]
    ;

    return <Container>
      <Row><h3>{this.props.draft.name}</h3></Row>
      <DraftInfo draft={this.props.draft}/>
      <Row>
        <BootstrapTable
          keyField='id'
          data={this.props.draft.seats}
          columns={columns}
          bootstrap4
          condensed
        />
      </Row>
      {
        this.props.draft.limitedSession &&
        this.props.draft.limitedSession.publicPools() &&
        <Row>
          <DraftSearchView draftSessionId={this.props.draft.id}/>
        </Row>
      }
    </Container>
  }

}

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    user: state.user,
  };
};


export default connect(mapStateToProps)(DraftView);
