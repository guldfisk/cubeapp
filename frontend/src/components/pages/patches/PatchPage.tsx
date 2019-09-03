import React from 'react';

import {Link} from "react-router-dom";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

import history from '../../routing/history';
import {Loading} from '../../utils/utils';
import {
  ConstrainedNode,
  Cubeable,
  CubeChange,
  Patch,
  Preview,
  Printing, Trap, VerbosePatch
} from '../../models/models';
import SearchView from "../../views/search/SearchView";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import TrapParseView from "../../views/traps/TrapParseView";
import {ConfirmationDialog} from "../../utils/dialogs";
import PatchPreview from "../../views/patchview/PatchPreview";
import ConstrainedNodeParseView from "../../views/traps/ConstrainedNodeParseView";
import {signIn} from "../../auth/controller";
import {connect} from "react-redux";
import Button from "react-bootstrap/Button";
import PatchMultiView from "../../views/patchview/PatchMultiView";

import {UserGroup} from "../../utils/utils";
import {jsJsx} from "ts-loader/dist/types/constants";
import UserGroupView from "../../views/users/UserGroupView";


interface DeltaPageProps {
  match: any
  authenticated: boolean
}

interface DeltaPageState {
  patch: null | Patch
  verbosePatch: VerbosePatch | null
  preview: null | Preview
  previewLoading: boolean
  confirmDelete: boolean
  editing: boolean
  editingConnection: WebSocket | null
  userGroup: UserGroup
}

class PatchPage extends React.Component<DeltaPageProps, DeltaPageState> {

  constructor(props: DeltaPageProps) {
    super(props);
    this.state = {
      patch: null,
      verbosePatch: null,
      preview: null,
      previewLoading: true,
      confirmDelete: false,
      editing: false,
      editingConnection: null,
      userGroup: new UserGroup(),
    };
  }

  setPatch = (patch: Patch) => {
    this.setState(
      {
        patch,
        previewLoading: true,
      }
    );
    patch.preview().then(
      (preview) => {
        this.setState(
          {
            previewLoading: false,
            preview: preview,
          }
        )
      }
    );
    patch.verbose().then(
      (verbosePatch) => {
        this.setState(
          {verbosePatch}
        )
      }
    );
  };

  handleMessage = (event: any) => {
    const message = JSON.parse(event.data);
    console.log(message);

    if (message.type === 'user_update') {
      if (message.action === 'enter' || message.action === 'here') {
        this.state.userGroup.add(message.user);
      } else if (message.action === 'leave') {
        this.state.userGroup.remove(message.user);
      }
      this.setState({userGroup: this.state.userGroup});
    } else if (message.type === 'update') {
      this.setState(
        {
          patch: Patch.fromRemote(message.content.patch),
          verbosePatch: VerbosePatch.fromRemote(message.content.verbose_patch),
          preview: Preview.fromRemote(message.content.preview),
        }
      )
    }
  };

  componentDidMount() {
    Patch.get(
      this.props.match.params.id
    ).then(
      patch => {
        this.setPatch(patch);
        this.setState(
          {
            editingConnection: patch.getEditWebsocket()
          },
          () => {
            this.state.editingConnection.onmessage = this.handleMessage;
          }
        );
      }
    );
  }

  componentWillUnmount(): void {
    this.state.editingConnection.close();
  }

  handleUpdatePatch = (update: Cubeable | ConstrainedNode, amount: number) => {
    Patch.updateWebsocket(this.state.editingConnection, [[update, amount]]);
    // Patch.updateWebsocket(this.state.editingConnection, [[update, amount]]).then(
    //   (patch: Patch) => {
    //     this.setPatch(patch);
    //   }
    // )
  };

  handleMultipleUpdatePatch = (updates: [Cubeable | ConstrainedNode | CubeChange, number][]) => {
    Patch.updateWebsocket(this.state.editingConnection, updates);
    // this.state.patch.update(updates).then(
    //   (patch: Patch) => {
    //     this.setPatch(patch);
    //   }
    // )
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
    this.state.patch.delete().then(
      () => {
        history.push('/cube/' + this.state.patch.cube.id + '/patches/')
      }
    )
  };

  render() {
    let patchView = <Loading/>;
    if (this.state.patch !== null) {
      patchView = <PatchMultiView
        patch={this.state.patch}
        verbosePatch={this.state.verbosePatch}
        onItemClicked={
          !this.state.editing ? undefined :
            this.handleUpdatePatch
        }
        onNodeEdit={
          !this.state.editing ? undefined :
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
          !this.state.editing ? undefined :
            (change, multiplicity) => {
              this.handleMultipleUpdatePatch([[change, multiplicity]])
            }
        }
        onNodeQtyEdit={
          !this.state.editing ? undefined :
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
          this.state.previewLoading || !this.state.editing ? undefined :
            this.handleCubeableClicked
        }
        onNodeClicked={
          this.state.previewLoading || !this.state.editing ? undefined :
            ((node, multiplicity) => this.handleUpdatePatch(node, -1))
        }
        onNodeEdit={
          this.state.previewLoading || !this.state.editing ? undefined :
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
          this.state.previewLoading || !this.state.editing ? undefined :
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
                    < p>
                      < Link
                        to={"/patch/" + this.props.match.params.id + '/apply'}
                      >
                        Apply patch
                      </Link>
                    </p>
                    <Button
                      onClick={() => this.setState({editing: !this.state.editing})}
                    >
                      {this.state.editing ? "Stop Editing" : "Edit"}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
          }
          {
            !this.state.editing ? undefined :
              <Col sm={3}>
                <Card>
                  <Card.Header>
                    Add cubeables
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
                    </Tabs>
                  </Card.Body>
                </Card>
              </Col>
          }
          {
            !this.state.editing ? undefined : <UserGroupView userGroup={this.state.userGroup} title="User editing"/>
          }
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