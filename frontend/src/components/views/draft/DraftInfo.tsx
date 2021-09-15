import React from 'react';

import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import {Link} from "react-router-dom";

import InfinitesView from "../infinites/InfinitesView";
import {DraftSession} from "../../models/models";
import PoolSpecificationView from "../limited/PoolSpecificationView";
import {DateListItem} from "../../utils/listitems";


interface DraftViewProps {
  draft: DraftSession;
}


export default class DraftInfo extends React.Component<DraftViewProps, null> {

  render() {

    return <Container>
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
            Reverse
          </label>
          <label>{this.props.draft.reverse.toString()}</label>
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
            Started
          </label>
          <DateListItem date={this.props.draft.startedAt}/>
        </Col>
        <Col>
          <label
            className='explain-label'
          >
            Ended
          </label>
          {this.props.draft.endedAt && <DateListItem date={this.props.draft.endedAt}/>}
        </Col>
      </Row>
      {
        this.props.draft.limitedSession ? <Row>
          <Col>
            <label
              className='explain-label'
            >
              Limited Session
            </label>
            <Link to={'/limited/' + this.props.draft.limitedSession.id + '/'}>
              {this.props.draft.limitedSession.name}
            </Link>
          </Col>

        </Row> : undefined
      }
      <Row>
        <Tabs
          id='limited-session-info-tabs'
          defaultActiveKey='poolSpecification'
        >
          <Tab eventKey='poolSpecification' title='Pool Specification'>
            <PoolSpecificationView specification={this.props.draft.poolSpecification}/>
          </Tab>
          <Tab eventKey='infinites' title='Infinites'>
            <InfinitesView
              infinites={this.props.draft.infinites}
            />
          </Tab>
        </Tabs>
      </Row>
    </Container>
  }

}

