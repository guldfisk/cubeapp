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
  CubeablesContainer,
  CubeRelease,
  Patch,
  Preview,
  Printing,
  Trap
} from '../../models/models';
import PatchView from '../../views/patchview/PatchView';
import SearchView from "../../views/search/SearchView";
import ReleaseMultiView from "../../views/releaseview/ReleaseMultiView";
import CubeablesCollectionListView from "../../views/cubeablescollectionview/CubeablesCollectionListView";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import TrapParseView from "../../views/traps/TrapParseView";
import {ConfirmationDialog} from "../../utils/dialogs";
import PatchPreview from "../../views/patchview/PatchPreview";
import ConstrainedNodeParseView from "../../views/traps/ConstrainedNodeParseView";


interface DeltaPageProps {
  match: any
}

interface DeltaPageState {
  patch: null | Patch
  preview: null | Preview
  previewLoading: boolean
  confirmDelete: boolean
}

export default class PatchPage extends React.Component<DeltaPageProps, DeltaPageState> {

  constructor(props: DeltaPageProps) {
    super(props);
    this.state = {
      patch: null,
      preview: null,
      previewLoading: true,
      confirmDelete: false,
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
  };

  componentDidMount() {
    Patch.get(
      this.props.match.params.id
    ).then(
      patch => {
        this.setPatch(patch)
      }
    );
  }

  handleUpdatePatch = (update: Cubeable | ConstrainedNode, amount: number) => {
    this.state.patch.update([[update, amount]]).then(
      (patch: Patch) => {
        this.setPatch(patch);
      }
    )
  };

  handleMultipleUpdatePatch = (updates: [Cubeable | ConstrainedNode, number][]) => {
    this.state.patch.update(updates).then(
      (patch: Patch) => {
        this.setPatch(patch);
      }
    )
  };


  handleDeletePatch = () => {
    this.state.patch.delete().then(
      () => {
        history.push('/cube/' + this.state.patch.cube().id() + '/patches/')
      }
    )
  };

  render() {
    let patchView = <Loading/>;
    if (this.state.patch !== null) {
      patchView = <PatchView
        patch={this.state.patch}
        onItemClicked={this.handleUpdatePatch}
      />
    }

    let preview = <Loading/>;
    if (this.state.preview) {
      preview = <PatchPreview
        preview={this.state.preview}
        onCubeablesClicked={
          this.state.previewLoading ? undefined :
          (cubeable => this.handleUpdatePatch(cubeable, -1))
        }
        onNodeClicked={
          this.state.previewLoading ? undefined :
          ((node, multiplicity) => this.handleUpdatePatch(node, -1))
        }
        onNodeEdit={
          this.state.previewLoading ? undefined :
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
                    to={"/patch/" + this.props.match.params.id + '/apply'}
                  >
                    Apply patch
                  </Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
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
          <Col>
            <Card>
              <Card.Header>
                Delta
              </Card.Header>
              <Card.Body>
                {patchView}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          {preview}
        </Row>
      </Container>
    </>
  }

}
