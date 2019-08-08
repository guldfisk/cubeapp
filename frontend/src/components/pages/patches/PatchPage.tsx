import React from 'react';

import {Link} from "react-router-dom";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

import history from '../../routing/history';
import {Loading} from '../../utils/utils';
import {Cubeable, CubeablesContainer, CubeRelease, Patch, Printing} from '../../models/models';
import PatchView from '../../views/patchview/PatchView';
import SearchView from "../../views/search/SearchView";
import ReleaseMultiView from "../../views/releaseview/ReleaseMultiView";
import CubeablesCollectionListView from "../../views/cubeablescollectionview/CubeablesCollectionListView";


interface DeltaPageProps {
  match: any
}

interface DeltaPageState {
  patch: null | Patch
  preview: null | CubeablesContainer
  previewLoading: boolean
}

export default class PatchPage extends React.Component<DeltaPageProps, DeltaPageState> {

  constructor(props: DeltaPageProps) {
    super(props);
    this.state = {
      patch: null,
      preview: null,
      previewLoading: true,
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
      (preview: CubeablesContainer) => {
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

  handleAddCard = (printing: Printing) => {
    this.state.patch.update(printing).then(
      (patch: Patch) => {
        this.setPatch(patch);
      }
    )
  };

  handleModifyCubeableAmount = (cubeable: Cubeable, amount: number) => {
    this.state.patch.update(cubeable, amount).then(
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
        onPrintingClicked={this.handleModifyCubeableAmount}
      />
    }

    let preview = <Loading/>;
    if (this.state.preview) {
      preview = <CubeablesCollectionListView
        cubeableType="Cubeables"
        rawCube={this.state.preview}
        onCubeableClicked={cubeable => this.handleModifyCubeableAmount(cubeable, -1)}
        noHover={true}
      />
    }

    return <Container fluid>
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
                  onClick={this.handleDeletePatch}
                >
                  Delete patch
                </Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <SearchView
            handleCardClicked={this.handleAddCard}
            limit={3}
          />
        </Col>
        <Col>
          {patchView}
        </Col>

      </Row>
      <Row>
        {preview}
      </Row>
    </Container>
  }

}
