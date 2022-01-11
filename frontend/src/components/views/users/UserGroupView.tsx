import React from 'react';

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

import {UserGroup} from "../../utils/utils";


interface UserGroupViewProps {
  userGroup: UserGroup
  title: string
}


export default class UserGroupView extends React.Component<UserGroupViewProps, null> {

  render() {
    return <Card>
      <Card.Header>
        {this.props.title}
      </Card.Header>
      <Card.Body>
        <ListGroup variant="flush">
          {
            Array.from(this.props.userGroup.users.entries()).map(
              ([name, _]) => <ListGroup.Item>
                {name}
              </ListGroup.Item>
            )
          }
        </ListGroup>
      </Card.Body>
    </Card>
  }

}