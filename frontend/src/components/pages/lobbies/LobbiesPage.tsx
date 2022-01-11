import React from 'react';

import {connect} from "react-redux";

import store from "../../state/store";
import {Lobby} from "../../models/lobbies";
import LobbiesView from "../../views/lobbies/LobbiesView";
import {MinimalCube, User} from "../../models/models";
import {Button, Modal} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import CreateCubeForm from "../../views/cubeview/CreateCubeForm";
import LobbyView from "../../views/lobbies/LobbyView";


interface CreateLobbyFormProps {
  handleSubmit: (name: string, gameType: string) => void
}

class CreateLobbyForm extends React.Component<CreateLobbyFormProps> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      event.target.elements.name.value,
      event.target.elements.gameType.value,
    );
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Group controlId="name">
        <Form.Label>Name</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group
        controlId="gameType"
      >
        <Form.Control
          as="select"
          name="game-type"
        >
          <option value="sealed" key="sealed">Sealed</option>
          <option value="sealed" key="draft">Draft</option>
        </Form.Control>
      </Form.Group>
      <Button type="submit">Create Lobby</Button>
    </Form>
  }

}

interface CreateLobbyDialogProps {
  handleSubmit: (name: string, gameType: string) => void
  cancel: () => void
  show: boolean
}


export const CreateLobbyDialog: React.FunctionComponent<CreateLobbyDialogProps> = (props: CreateLobbyDialogProps) => {
  return <Modal
    show={props.show}
    onHide={props.cancel}
  >
    <Modal.Header closeButton>
      <Modal.Title>Create Lobby</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <CreateLobbyForm
        handleSubmit={props.handleSubmit}
      />
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={props.cancel}>Cancel</Button>
    </Modal.Footer>
  </Modal>
};


interface LobbiesPageProps {
  match: any
  authenticated: boolean
  user: User
}

interface LobbiesPageState {
  lobbiesConnection: WebSocket | null
  lobbies: Lobby[]
  creatingLobby: boolean
}

class LobbiesPage extends React.Component<LobbiesPageProps, LobbiesPageState> {

  constructor(props: LobbiesPageProps) {
    super(props);
    this.state = {
      lobbiesConnection: null,
      lobbies: [],
      creatingLobby: false,
    };
  }


  handleMessage = (event: any) => {
    const message = JSON.parse(event.data);
    console.log(message)
    if (message.type === 'all_lobbies') {
      this.setState(
        {
          lobbies: message.lobbies.map((raw: any) => Lobby.fromRemote(raw))
        }
      )
    } else if (message.type === 'lobby_created') {
      this.setState(
        (state) => ({lobbies: [...state.lobbies, Lobby.fromRemote(message.lobby)]})
      )
    } else if (message.type === 'lobby_closed') {
      this.setState(
        (state) => ({lobbies: state.lobbies.filter((lobby) => lobby.name != message.name)})
      )
    } else if (message.type === 'lobby_update') {
      this.setState(
        (state) => (
          {
            lobbies: state.lobbies.map(
              (lobby) => lobby.name === message.lobby.name ? Lobby.fromRemote(message.lobby) : lobby
            )
          }
        )
      )
    }

  };

  send = (message: any) => {
    this.state.lobbiesConnection.send(
      JSON.stringify(
        message
      )
    )
  }

  joinLobby = (lobby: Lobby) => {
    this.send(
      {
        type: 'join',
        name: lobby.name,
      }
    )
  }

  leaveLobby = (lobby: Lobby) => {
    this.send(
      {
        type: 'leave',
        name: lobby.name,
      }
    )
  }

  createLobby = (name: string, gameType: string) => {
    this.send(
      {
        type: 'create',
        name,
        game_type: gameType,
      }
    )
  }

  getLobbiesWebsocket = (): WebSocket => {
    const url = new URL('/ws/lobbies/', window.location.href);
    url.protocol = url.protocol.replace('http', 'ws');
    const ws = new WebSocket(url.href);

    ws.onopen = () => {
      console.log('connected');
      ws.send(
        JSON.stringify(
          {
            type: 'authentication',
            token: store.getState().token,
          }
        )
      );
    };

    ws.onclose = () => {
      console.log('disconnected');
    };

    return ws;
  };


  componentDidMount() {
    this.setState(
      {
        lobbiesConnection: this.getLobbiesWebsocket(),
      },
      () => {
        this.state.lobbiesConnection.onmessage = this.handleMessage;
      }
    );
  }

  componentWillUnmount(): void {
    if (this.state.lobbiesConnection && this.state.lobbiesConnection.OPEN) {
      this.state.lobbiesConnection.close();
    }
  }

  render() {
    return <>
      {
        this.state.creatingLobby && <CreateLobbyDialog
          handleSubmit={
            (...args) => {
              this.createLobby(...args);
              this.setState({creatingLobby: false});
            }
          }
          cancel={() => this.setState({creatingLobby: false})}
          show={this.state.creatingLobby}
        />
      }
      <LobbiesView lobbies={this.state.lobbies} onJoin={this.joinLobby} user={this.props.user}/>
      <Button
        onClick={() => this.setState({creatingLobby: true})}
      >
        Create lobby
      </Button>
      {
        this.state.lobbies.filter(
          (lobby) => lobby.hasUsername(this.props.user.username)
        ).map(
          (lobby) => <LobbyView lobby={lobby} onLeave={this.leaveLobby} key={lobby.name}/>
        )
      }
    </>
  }

}


const mapStateToProps = (state: any) => {
    return {
      authenticated: state.authenticated,
      user: state.user,
    };
  }
;


export default connect(mapStateToProps)(LobbiesPage);
