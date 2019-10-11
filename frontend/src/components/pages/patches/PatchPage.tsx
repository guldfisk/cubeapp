import React from 'react';
import {Link} from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import {connect} from "react-redux";
import Button from "react-bootstrap/Button";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import history from '../../routing/history';
import {Loading} from '../../utils/utils';
import {
  ConstrainedNode,
  Cubeable,
  CubeChange,
  ReleasePatch,
  Preview,
  Printing, Trap, VerbosePatch, Patch
} from '../../models/models';
import SearchView from "../../views/search/SearchView";
import TrapParseView from "../../views/traps/TrapParseView";
import {ConfirmationDialog} from "../../utils/dialogs";
import PatchPreview from "../../views/patchview/PatchPreview";
import ConstrainedNodeParseView from "../../views/traps/ConstrainedNodeParseView";
import {signIn} from "../../auth/controller";
import PatchMultiView from "../../views/patchview/PatchMultiView";
import {UserGroup} from "../../utils/utils";
import UserGroupView from "../../views/users/UserGroupView";
import GroupAddView from "../../views/groupmap/GroupAddView";
import Alert from "react-bootstrap/Alert";


interface DeltaPageProps {
  match: any
  authenticated: boolean
}

interface DeltaPageState {
  patch: null | Patch
  releasePatch: null | ReleasePatch
  verbosePatch: VerbosePatch | null
  preview: null | Preview
  confirmDelete: boolean
  editing: boolean
  locked: boolean
  editingConnection: WebSocket | null
  userGroup: UserGroup
  awaitingUpdate: boolean
}

class PatchPage extends React.Component<DeltaPageProps, DeltaPageState> {

  constructor(props: DeltaPageProps) {
    super(props);
    this.state = {
      patch: null,
      releasePatch: null,
      verbosePatch: null,
      preview: null,
      confirmDelete: false,
      editing: false,
      locked: false,
      editingConnection: null,
      userGroup: new UserGroup(),
      awaitingUpdate: false,
    };
  }

  setReleasePatch = (releasePatch: ReleasePatch) => {
    this.setState(
      {
        releasePatch,
        patch: releasePatch.patch,
      }
    );
    releasePatch.preview().then(
      (preview) => {
        this.setState(
          {
            preview: preview,
          }
        )
      }
    );
    releasePatch.verbose().then(
      (verbosePatch) => {
        this.setState(
          {verbosePatch}
        )
      }
    );
  };

  handleMessage = (event: any) => {
    const message = JSON.parse(event.data);

    if (message.type === 'user_update') {
      if (message.action === 'enter' || message.action === 'here') {
        this.state.userGroup.add(message.user);
      } else if (message.action === 'leave') {
        this.state.userGroup.remove(message.user);
      }
      this.setState({userGroup: this.state.userGroup});

    } else if (message.type === 'status') {
      if (message.status === 'locked') {
        this.setState({locked: true})
      } else if (message.status === 'unlocked') {
        this.setState({locked: false})
      }

    } else if (message.type === 'update') {
      this.setState(
        {
          patch: Patch.fromRemote(message.content.patch),
          verbosePatch: VerbosePatch.fromRemote(message.content.verbose_patch),
          preview: Preview.fromRemote(message.content.preview),
          awaitingUpdate: false,
        }
      )

    }

  };

  stopEdit = () => {
    if (this.state.editingConnection && this.state.editingConnection.OPEN) {
      this.state.editingConnection.close()
    }
    this.setState({editing: false})
  };

  beginEdit = () => {
    if (!this.state.patch) {
      return
    }
    this.setState(
      {
        editingConnection: this.state.releasePatch.getEditWebsocket(),
        editing: true,
      },
      () => {
        this.state.editingConnection.onmessage = this.handleMessage;
        this.state.editingConnection.onclose = () => this.setState({editing: false});
      }
    );
  };

  componentDidMount() {
    ReleasePatch.get(
      this.props.match.params.id
    ).then(
      patch => {
        this.setReleasePatch(patch);
      }
    );
  }

  componentWillUnmount(): void {
    if (this.state.editingConnection && this.state.editingConnection.OPEN) {
      this.state.editingConnection.close();
    }
  }

  handleUpdatePatch = (update: Cubeable | ConstrainedNode | string, amount: number) => {
    this.setState({awaitingUpdate: true});
    ReleasePatch.updateWebsocket(this.state.editingConnection, [[update, amount]]);
  };

  handleMultipleUpdatePatch = (updates: [Cubeable | ConstrainedNode | CubeChange | string, number][]) => {
    this.setState({awaitingUpdate: true});
    ReleasePatch.updateWebsocket(this.state.editingConnection, updates);
  };

  handleCubeableClicked = (cubeable: Cubeable, multiplicity: number): void => {
    if (cubeable instanceof Printing) {
      this.handleMultipleUpdatePatch(
        [
          [cubeable, -multiplicity],
          [ConstrainedNode.wrappingPrinting(cubeable), multiplicity],
        ]
      )
    } else if (cubeable instanceof Trap) {
      this.handleMultipleUpdatePatch(
        [
          [cubeable, -multiplicity],
          [ConstrainedNode.fromTrap(cubeable), multiplicity],
        ]
      )
    } else {
      this.handleMultipleUpdatePatch(
        [
          [cubeable, -1],
        ]
      )
    }
  };

  handleDeletePatch = () => {
    this.state.releasePatch.delete().then(
      () => {
        history.push('/cube/' + this.state.releasePatch.cube.id + '/patches/')
      }
    )
  };

  handleForkPatch = () => {
    this.state.releasePatch.fork().then(
      patch => {
        history.push('/patch/' + patch.id);
      }
    )
  };

  canEdit = (): boolean => {
    return this.state.editing && !this.state.locked && !this.state.awaitingUpdate
  };

  render() {
    let patchView = <Loading/>;
    if (this.state.patch !== null) {
      patchView = <PatchMultiView
        patch={this.state.patch}
        verbosePatch={this.state.verbosePatch}
        onItemClicked={
          !this.canEdit() ? undefined :
            this.handleUpdatePatch
        }
        onNodeEdit={
          !this.canEdit() ? undefined :
            (
              (oldNode, newNode, multiplicity) => {
                this.handleMultipleUpdatePatch(
                  [
                    [oldNode, -multiplicity],
                    [newNode, multiplicity],
                  ]
                )
              }
            )
        }
        onChangeClicked={
          !this.canEdit() ? undefined :
            (change, multiplicity) => {
              this.handleMultipleUpdatePatch([[change, multiplicity]])
            }
        }
        onNodeQtyEdit={
          !this.canEdit() ? undefined :
            (
              (oldValue, newValue, node) => {
                this.handleMultipleUpdatePatch(
                  [
                    [node, newValue - oldValue],
                  ]
                )
              }
            )
        }
      />
    }

    let preview = <Loading/>;
    if (this.state.preview) {
      preview = <PatchPreview
        preview={this.state.preview}
        onCubeablesClicked={
          !this.canEdit() ? undefined :
            this.handleCubeableClicked
        }
        onNodeClicked={
          !this.canEdit() ? undefined :
            ((node, multiplicity) => this.handleUpdatePatch(node, -1))
        }
        onNodeEdit={
          !this.canEdit() ? undefined :
            (
              (oldNode, newNode, multiplicity) => {
                this.handleMultipleUpdatePatch(
                  [
                    [oldNode, -multiplicity],
                    [newNode, multiplicity],
                  ]
                )
              }
            )
        }
        onNodeQtyEdit={
          !this.canEdit() ? undefined :
            (
              (oldValue, newValue, node) => {
                this.handleMultipleUpdatePatch(
                  [
                    [node, newValue - oldValue],
                  ]
                )
              }
            )
        }
        onGroupClicked={
          !this.canEdit() ? undefined : (
            (group, weight) => {
              this.handleUpdatePatch(group, -weight)
            }
          )
        }
        onGroupEdit={
          !this.canEdit() ? undefined : (
            (group, oldValue, newValue) => {
              this.handleUpdatePatch(group, newValue - oldValue)
            }
          )
        }
      />;
    }

    return <>
      <ConfirmationDialog
        show={this.state.confirmDelete}
        callback={this.handleDeletePatch}
        cancel={() => this.setState({confirmDelete: false})}
      />

      <Container fluid>
        <Row>
          {
            !this.props.authenticated ? undefined :
              <Col sm={2}>
                <Card>
                  <Card.Header>
                    Actions
                  </Card.Header>
                  <Card.Body>
                    <p>
                      <Link
                        to={"#"}
                        onClick={
                          () => this.setState(
                            {confirmDelete: true}
                          )
                        }
                      >
                        Delete patch
                      </Link>
                    </p>
                    <p>
                      <Link
                        to={"#"}
                        onClick={this.handleForkPatch}
                      >
                        Fork patch
                      </Link>
                    </p>
                    < p>
                      < Link
                        to={"/patch/" + this.props.match.params.id + '/apply'}
                      >
                        Apply patch
                      </Link>
                    </p>
                    <Button
                      onClick={() => this.state.editing ? this.stopEdit() : this.beginEdit()}
                    >
                      {this.state.editing ? "Stop Editing" : "Edit"}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
          }
          <Col>
            {
              !this.state.locked ? undefined : <Row>
                <Alert variant="danger">Patch currently being checked out</Alert>
              </Row>
            }
            <Row>
              {
                !this.state.editing ? undefined :
                  <Col sm={3}>
                    <Card>
                      <Card.Header>
                        Add
                      </Card.Header>
                      <Card.Body>
                        <Tabs
                          id='add-cubeables-tabs'
                          defaultActiveKey='addPrinting'
                        >
                          <Tab eventKey='addPrinting' title='Printing'>
                            <Card>
                              <Card.Body>
                                <SearchView
                                  handleCardClicked={(printing: Printing) => this.handleUpdatePatch(printing, 1)}
                                  limit={3}
                                />
                              </Card.Body>
                            </Card>
                          </Tab>
                          <Tab eventKey='addTrap' title='Trap'>
                            <TrapParseView
                              onSubmit={trap => this.handleUpdatePatch(trap, 1)}
                            />
                          </Tab>
                          <Tab eventKey='addNode' title='Node'>
                            <ConstrainedNodeParseView
                              onSubmit={node => this.handleUpdatePatch(node, 1)}
                            />
                          </Tab>
                          <Tab eventKey='addGroup' title='Group'>
                            <GroupAddView
                              onSubmit={this.handleUpdatePatch}
                            />
                          </Tab>
                        </Tabs>
                      </Card.Body>
                    </Card>
                  </Col>
              }
              {
                !this.state.editing ? undefined :
                  <Col sm={2}>
                    <UserGroupView userGroup={this.state.userGroup} title="User editing"/>
                  </Col>
              }
            </Row>
          </Col>
        </Row>
        <Row>
          <Card>
            <Card.Header>
              Delta
            </Card.Header>
            <Card.Body>
              {patchView}
            </Card.Body>
          </Card>
        </Row>
        <Row>
          {preview}
        </Row>
      </Container>
    </>
  }

}


const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
  };
};


const mapDispatchToProps = (dispatch: any) => {
  return {
    signIn: (username: string, password: string) => {
      return dispatch(signIn(username, password));
    }
  };
};


export default connect(mapStateToProps, mapDispatchToProps)(PatchPage);