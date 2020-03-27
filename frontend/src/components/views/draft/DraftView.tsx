import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {DateListItem} from "../../utils/listitems";
import {connect} from "react-redux";

import {DraftSession, User} from "../../models/models";
import '../../../styling/SessionsView.css';
import PoolSpecificationView from "../limited/PoolSpecificationView";
import {Link} from "react-router-dom";


interface DraftViewProps {
  draft: DraftSession;
  authenticated: boolean;
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
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to='#'
        >
          view
        </Link>,
        isDummyField: true,
      },
    ];

    return <Container>
      <Row><h3>{this.props.draft.name}</h3></Row>
      <Row>
        <Col>
          <label
            className='explain-label'
          >
            Draft Format
          </label>
          <label>{this.props.draft.draftFormat}</label>
        </Col>
        <Col>
          <label
            className='explain-label'
          >
            State
          </label>
          <label>{this.props.draft.state}</label>
        </Col>
      </Row>
      <Row>
        <Col>
          <label
            className='explain-label'
          >
            started
          </label>
          <DateListItem date={this.props.draft.startedAt}/>
        </Col>
        <Col>
          <label
            className='explain-label'
          >
            ended
          </label>
          {this.props.draft.endedAt && <DateListItem date={this.props.draft.endedAt}/>}
        </Col>
      </Row>
      <Row>
        <PoolSpecificationView specification={this.props.draft.poolSpecification}/>
      </Row>
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
