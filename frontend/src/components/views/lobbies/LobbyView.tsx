import React from 'react';

import {connect} from "react-redux";

import Card from "react-bootstrap/Card";

import {Lobby} from "../../models/lobbies";
import {User} from "../../models/models";
import {Button} from "react-bootstrap";


interface LobbyViewProps {
  lobby: Lobby
  authenticated: boolean
  user: User
  onLeave: (lobby: Lobby) => void
}


interface LobbyViewState {
}

class LobbyView extends React.Component<LobbyViewProps, LobbyViewState> {

  constructor(props: LobbyViewProps) {
    super(props);
    this.state = {}
  }

  render() {
    return <Card>
      <Card.Header>
        {this.props.lobby.name}
      </Card.Header>
      <Card.Body>
        some content
        {
          this.props.authenticated && this.props.lobby.hasUsername(this.props.user.username) && <Button
            onClick={() => this.props.onLeave(this.props.lobby)}
          >
            Leave
          </Button>
        }
      </Card.Body>
    </Card>

  }

}

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    user: state.user,
  };
};


export default connect(mapStateToProps)(LobbyView);
