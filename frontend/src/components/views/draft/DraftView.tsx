import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import {connect} from "react-redux";

import {DraftSeat, DraftSession, User} from "../../models/models";
import {Link} from "react-router-dom";
import DraftInfo from "./DraftInfo";


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
          formatter: (cell: User, row: any, rowIndex: number, formatExtraData: any) => cell.username,
        },
        {
          text: '',
          headerStyle: (column: any, colIndex: number) => {
            return {width: '3em', textAlign: 'center'};
          },
          formatter: (cell: any, row: DraftSeat, rowIndex: number, formatExtraData: any) => (
            this.props.draft.limitedSession && this.props.draft.limitedSession.publicPools()
            || this.props.authenticated && this.props.user.id == row.user.id
          ) ? <Link
            to={'/seat/' + row.id + '/0/'}
          >
            view
          </Link> : undefined,
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
    </Container>
  }

}

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    user: state.user,
  };
};


const mapDispatchToProps = (dispatch: any) => {
  return {};
};


export default connect(mapStateToProps, mapDispatchToProps)(DraftView);
