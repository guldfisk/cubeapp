import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {FullLimitedSession, User} from "../../models/models";
import {Link} from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {DateListItem} from "../../utils/listitems";
import {connect} from "react-redux";

import '../../../styling/SessionsView.css';
import PoolSpecificationView from "./PoolSpecificationView";


interface SessionViewProps {
  session: FullLimitedSession;
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
          this.props.session.state == 'FINISHED'
          || this.props.session.state == 'PLAYING' && this.props.session.openDecks
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

    console.log(this.props.session);

    return <Container>
      <Row><h3>{this.props.session.name}</h3></Row>
      <Row>
        <Col>
          <label
            className='explain-label'
          >
            Format
          </label>
          <label>{this.props.session.format}</label>
        </Col>
        <Col>
          <label
            className='explain-label'
          >
            Game Type
          </label>
          <label>{this.props.session.gameType}</label>
        </Col>
        <Col>
          <label
            className='explain-label'
          >
            State
          </label>
          <label>{this.props.session.state}</label>
        </Col>
      </Row>
      <Row>
        <Col>
          <label
            className='explain-label'
          >
            Created
          </label>
          <DateListItem date={this.props.session.createdAt}/>
        </Col>
        <Col>
          <label
            className='explain-label'
          >
            Playing
          </label>
          {this.props.session.playingAt ? <DateListItem date={this.props.session.playingAt}/> : undefined}
        </Col>
        <Col>
          <label
            className='explain-label'
          >
            Finished
          </label>
          {this.props.session.finishedAt ? <DateListItem date={this.props.session.finishedAt}/> : undefined}
        </Col>
      </Row>
      <Row>
        <Col>
          <label
            className='explain-label'
          >
            Open decks
          </label>
          <label>{this.props.session.openDecks.toString()}</label>
        </Col>
      </Row>
      <Row>
        <PoolSpecificationView specification={this.props.session.poolSpecification}/>
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