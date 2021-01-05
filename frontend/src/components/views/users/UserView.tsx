import React from 'react';

import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";

import {
  FullUser,
} from "../../models/models";
import {DateListItem} from "../../utils/listitems";


interface UserViewProps {
  user: FullUser;
}


interface UserViewState {
}


export class UserView extends React.Component<UserViewProps, UserViewState> {

  constructor(props: UserViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <>
      <Card>
        <Card.Header>
          <h3>
            <label>
              {this.props.user.username}
            </label>
          </h3>
        </Card.Header>
        <Card.Body>
          <Container fluid>
            <Row>
              <Col>
                <label
                  className='explain-label'
                >
                  Joined
                </label>
                <DateListItem date={this.props.user.joinedAt}/>
              </Col>
              <Col>
                <label
                  className='explain-label'
                >
                  Cube Coins
                </label>
                1000
              </Col>
            </Row>
          </Container>
        </Card.Body>
      </Card>
    </>
  }

}

