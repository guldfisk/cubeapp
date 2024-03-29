import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import React from 'react';
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import {connect} from "react-redux";
import {Link} from "react-router-dom";

import {
  ConstrainedNode,
  Cubeable,
  CubeChange,
  ReleasePatch,
  Preview,
  Printing, Trap, VerbosePatch, Patch, User, EditEvent, Cardboard
} from '../../models/models';
import ConstrainedNodeParseView from "../../views/traps/ConstrainedNodeParseView";
import EditHistoryView from "../../views/patchview/EditHistory";
import GroupAddView from "../../views/groupmap/GroupAddView";
import history from '../../routing/history';
import PatchMultiView from "../../views/patchview/PatchMultiView";
import PatchPreview from "../../views/patchview/PatchPreview";
import TrapParseView from "../../views/traps/TrapParseView";
import UserGroupView from "../../views/users/UserGroupView";
import {CardboardSearchView, PrintingSearchView} from "../../views/search/SearchView";
import {ConfirmationDialog} from "../../utils/dialogs";
import {Loading} from '../../utils/utils';
import {signIn} from "../../auth/controller";
import {UserGroup} from "../../utils/utils";


interface PatchPageProps {
  match: any
  authenticated: boolean
}

interface PatchPageState {
  patch: null | Patch
  releasePatch: null | ReleasePatch
  verbosePatch: VerbosePatch | null
  preview: null | Preview
  confirmDelete: boolean
  editing: boolean
  locked: boolean
  editingConnection: WebSocket | null
  userGroup: UserGroup
  editHistory: EditEvent[]
  nodeEditMode: boolean
}

class PatchPage extends React.Component<PatchPageProps, PatchPageState> {

  constructor(props: PatchPageProps) {
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
      editHistory: [],
      nodeEditMode: true,
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
            preview,
            nodeEditMode: !preview.constrainedNodes.nodes.isEmpty(),
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
          editHistory: [
            new EditEvent(
              User.fromRemote(message.content.updater),
              VerbosePatch.fromRemote(message.content.update),
            )
          ].concat(this.state.editHistory),
        }
      )

    }

  };

  stopEdit = () => {
    if (this.state.editingConnection && this.state.editingConnection.OPEN) {
      this.state.editingConnection.close()
    }
    this.setState({editing: false});
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
    ReleasePatch.updateWebsocket(this.state.editingConnection, [[update, amount]]);
  };

  handleMultipleUpdatePatch = (updates: [Cubeable | ConstrainedNode | CubeChange | string, number][]) => {
    ReleasePatch.updateWebsocket(this.state.editingConnection, updates)
  };

  handleCubeableClicked = (cubeable: Cubeable, multiplicity: number): void => {
    if (!this.state.nodeEditMode) {
      this.handleMultipleUpdatePatch(
        [
          [cubeable, -1],
        ]
      )
    } else if (cubeable instanceof Printing) {
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
    );
  };

  canEdit = (): boolean => {
    return this.state.editing && !this.state.locked
  };

  undoEditEvent = (event: EditEvent): void => {
    this.handleMultipleUpdatePatch(
      Array.from(
        event.change.changes.items()
      )
    );
  };

  render() {
    let patchView = <Loading/>;
    if (this.state.patch !== null) {
      patchView = <PatchMultiView
        patch={this.state.patch}
        verbosePatch={this.state.verbosePatch}
        onItemClicked={
          !this.canEdit() ? null :
            this.handleUpdatePatch
        }
        onNodeEdit={
          !this.canEdit() ? null :
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
        onNodeRemove={
          this.canEdit() ?
            (node, multiplicity) => this.handleUpdatePatch(node, -multiplicity)
            : null
        }
        onChangeClicked={
          !this.canEdit() ? null :
            (change, multiplicity) => {
              this.handleMultipleUpdatePatch([[change, multiplicity]])
            }
        }
        onNodeQtyEdit={
          !this.canEdit() ? null :
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
          !this.canEdit() ? null :
            this.handleCubeableClicked
        }
        onNodeClicked={
          !this.canEdit() ? null :
            ((node, multiplicity) => this.handleUpdatePatch(node, -1))
        }
        onNodeRemove={
          this.canEdit() ?
            (node, multiplicity) => this.handleUpdatePatch(node, -multiplicity)
            : null
        }
        onNodeEdit={
          !this.canEdit() ? null :
            (
              (oldNode, newNode, multiplicity) => {
                if (newNode.node.children.items.length || true) {
                  this.handleMultipleUpdatePatch(
                    [
                      [oldNode, -multiplicity],
                      [newNode, multiplicity],
                    ]
                  )
                } else {
                  this.handleUpdatePatch(oldNode, -multiplicity)
                }
              }
            )
        }
        onNodeQtyEdit={
          !this.canEdit() ? null :
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
          !this.canEdit() ? null : (
            (group, weight) => {
              this.handleUpdatePatch(group, -weight)
            }
          )
        }
        onGroupEdit={
          !this.canEdit() ? null : (
            (group, oldValue, newValue) => {
              this.handleUpdatePatch(group, newValue - oldValue)
            }
          )
        }
        onInfiniteClicked={
          !this.canEdit() ? null : (
            cardboard => this.handleUpdatePatch(cardboard, -1)
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
            this.props.authenticated && <Col sm={2}>
              <Card>
                <Card.Header>
                  {!this.state.releasePatch ? "" : this.state.releasePatch.name}
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
                  {
                    this.state.editing && <p>
                      <input
                        type="checkbox"
                        id="node_edit_mode"
                        name="node_edit_mode"
                        checked={this.state.nodeEditMode}
                        onClick={() => this.setState({nodeEditMode: !this.state.nodeEditMode})}
                      />
                      <label htmlFor='node_edit_mode'>Node edit mode</label>
                    </p>
                  }
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
                  <Col sm={6}>
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
                                <PrintingSearchView
                                  handleCubeableClicked={(printing: Printing) => this.handleUpdatePatch(printing, 1)}
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
                          <Tab eventKey='addInfinite' title='Infinite'>
                            <CardboardSearchView
                              handleCubeableClicked={(cardboard: Cardboard) => this.handleUpdatePatch(cardboard, 1)}
                              limit={3}
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
                    <UserGroupView userGroup={this.state.userGroup} title="Users editing"/>
                  </Col>
              }
              {
                !this.state.editing ? undefined :
                  <Col sm={4}>
                    <Card>
                      <Card.Header>
                        History
                      </Card.Header>
                      <Card.Body>
                        <EditHistoryView
                          history={this.state.editHistory}
                          eventClicked={
                            this.canEdit() ? this.undoEditEvent : undefined
                          }
                        />
                      </Card.Body>
                    </Card>
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