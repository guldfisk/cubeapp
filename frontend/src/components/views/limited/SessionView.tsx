import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {Link} from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {connect} from "react-redux";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";

import {DateListItem} from "../../utils/listitems";
import {FullLimitedSession, Tournament, User} from "../../models/models";
import PoolSpecificationView from "./PoolSpecificationView";
import InfinitesView from "../infinites/InfinitesView";
import TournamentView from "../tournaments/TournamentView";


interface SessionViewProps {
  session: FullLimitedSession;
  authenticated: boolean;
  user: User | null;
  onChange?: (() => void) | null;
}


interface SessionViewState {
  tournament: Tournament | null;
}


class SessionView extends React.Component<SessionViewProps, SessionViewState> {

  constructor(props: SessionViewProps) {
    super(props);
    this.state = {
      tournament: props.session.tournament,
    }
  }

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
        formatter: (cell: any) => cell.username,
      },
      {
        dataField: 'decks',
        text: 'Deck',
        formatter: (cell: any) => !!cell.length,
      },
      {
        dataField: 'view',
        text: '',
        headerStyle: () => {
          return {width: '3em', textAlign: 'center'};
        },
        formatter: (cell: any, row: any) => (
          this.props.session.publicPools()
          || this.props.authenticated && (
            this.props.user.id == row.user.id
            || this.props.session.openDecks
            && this.props.session.pools.some(
              pool => pool.decks && pool.user.id == this.props.user.id
            )
          )
        ) && <Link
          to={'/pools/' + row.id + '/'}
        >
          view
        </Link>,
        sort: false,
        editable: false,
        isDummyField: true,
      },
    ];

    return <>
      <Container>
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
              Open Decks
            </label>
            <label>{this.props.session.openDecks.toString()}</label>
          </Col>
          <Col>
            <label
              className='explain-label'
            >
              Open Pools
            </label>
            <label>{this.props.session.openPools.toString()}</label>
          </Col>
        </Row>
        <Row>
          <Tabs
            id='limited-session-info-tabs'
            defaultActiveKey='poolSpecification'
          >
            <Tab eventKey='poolSpecification' title='Pool Specification'>
              <PoolSpecificationView specification={this.props.session.poolSpecification}/>
            </Tab>
            <Tab eventKey='infinites' title='Infinites'>
              <InfinitesView
                infinites={this.props.session.infinites}
              />
            </Tab>
          </Tabs>
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
      {
        this.state.tournament &&
        <TournamentView
          tournament={this.state.tournament}
          handleMatchSubmitted={
            () => Tournament.get(
              this.state.tournament.id
            ).then(
              tournament => {
                this.setState({tournament});
                if (tournament.state == 'FINISHED' && this.props.onChange) {
                  this.props.onChange()
                }
              }
            )
          }
          handleCanceled={
            tournament => {
              this.setState({tournament});
              if (this.props.onChange) {
                this.props.onChange()
              }
            }
          }
        />
      }
    </>
  }

}

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    user: state.user,
  };
};

export default connect(mapStateToProps)(SessionView);