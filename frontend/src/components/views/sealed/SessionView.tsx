import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {CubeReleaseName, FullSealedSession, User} from "../../models/models";
import {Link} from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {DateListItem} from "../../utils/listitems";
import {signIn} from "../../auth/controller";
import {connect} from "react-redux";


interface SessionViewProps {
  session: FullSealedSession;
  authenticated: boolean;
  user: User | null;
}


class SessionView extends React.Component<SessionViewProps, null> {

  render() {

    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'user',
        text: 'Player',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell.username,
      },
      {
        dataField: 'decks',
        text: 'Decks',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell.length,
      },
      {
        text: '',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => (
          this.props.session.state != 'DECK_BUILDING'
          || this.props.authenticated && this.props.user.id == row.user.id
        ) ? <Link
          to={'/pools/' + row.id + '/'}
        >
          view
        </Link> : undefined,
        sort: false,
        editable: false,
        isDummyField: true,
      },
    ];

    return <Container>
      <Row><h3>{this.props.session.name}</h3></Row>
      <Row>
        <Col>
          <label
            style={
              {
                display: 'inline-block',
                margin: '1em',
              }
            }
          >
            State
          </label>
          <label>{this.props.session.state}</label>
        </Col>
        <Col>
          <label
            style={
              {
                display: 'inline-block',
                margin: '1em',
              }
            }
          >
            Format
          </label>
          <label>{this.props.session.format}</label>
        </Col>
        <Col>
          <label
            style={
              {
                display: 'inline-block',
                margin: '1em',
              }
            }
          >
            Created
          </label>
          <DateListItem date={this.props.session.createdAt}/>
        </Col>
        <Col>
          <label
            style={
              {
                display: 'inline-block',
                margin: '1em',
              }
            }
          >
            Release
          </label>
          <Link to={'/release/' + this.props.session.release.id + '/'}>{this.props.session.release.name}</Link>
        </Col>
      </Row>
      <Row>
        <BootstrapTable
          keyField='id'
          data={this.props.session.pools}
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


export default connect(mapStateToProps, mapDispatchToProps)(SessionView);