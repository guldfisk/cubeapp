import React from 'react';

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import Alert from "react-bootstrap/Alert";
import {connect} from "react-redux";
import {DateListItem} from "../../utils/listitems";
import {FullUser, User} from "../../models/models";
import {userEdited} from "../../state/actions";


interface UserViewProps {
  user: FullUser;
  authenticated: boolean
  authenticatedUser: User
  dispatch: any
}


interface UserViewState {
  editing: boolean
  userName: string
  error: string
}


class UserView extends React.Component<UserViewProps, UserViewState> {

  constructor(props: UserViewProps) {
    super(props);
    this.state = {
      editing: false,
      userName: this.props.user.username,
      error: '',
    }
  }

  render() {
    return <>
      <Card>
        <Card.Header
          className="d-flex justify-content-between panel-heading"
        >
          <h3>
            {
              this.state.editing ?
                <input
                  value={this.state.userName}
                  onChange={(event: any) => this.setState({userName: event.target.value})}
                />
                : <label>
                  {this.state.userName}
                </label>
            }
          </h3>
          {
            this.props.authenticated
            && !this.state.editing
            && this.props.user.id == this.props.authenticatedUser.id
            && <i
              className="fa fa-edit"
              onClick={() => this.setState({editing: true})}
            />
          }
        </Card.Header>
        <Card.Body>
          <Alert variant="danger" show={!!this.state.error}>
            {this.state.error}
          </Alert>
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
            {
              this.state.editing && <Row>
                <Button
                  onClick={
                    () => this.setState(
                      {error: ''},
                      () => User.edit({username: this.state.userName}).then(
                        user => this.props.dispatch({type: userEdited, user})
                      ).then(
                        () => this.setState({editing: false})
                      ).catch(
                        () => this.setState({error: 'Could not change name :('})
                      )
                    )
                  }
                >
                  Save
                </Button>
                <Button
                  onClick={
                    () => this.setState(
                      {
                        editing: false,
                        error: '',
                        userName: this.props.authenticatedUser.username,
                      }
                    )
                  }
                >
                  Cancel
                </Button>
              </Row>
            }
          </Container>
        </Card.Body>
      </Card>
    </>
  }
}


const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    authenticatedUser: state.user,
  };
};


export default connect(mapStateToProps)(UserView);
