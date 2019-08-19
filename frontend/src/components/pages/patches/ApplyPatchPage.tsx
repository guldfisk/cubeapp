import React from 'react';
import {CubeablesContainer, CubeRelease, Patch, Preview} from "../../models/models";
import {Loading} from "../../utils/utils";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import CubeablesCollectionListView from "../../views/cubeablescollectionview/CubeablesCollectionListView";
import {Container} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import {Redirect} from "react-router";
import PatchPreview from "../../views/patchview/PatchPreview";


interface DeltaPageProps {
  match: any
}

interface ApplyPatchPageState {
  patch: null | Patch
  preview: null | Preview
  previewLoading: boolean
  resultingRelease: null | CubeRelease
}

export default class ApplyPatchPage extends React.Component<DeltaPageProps, ApplyPatchPageState> {

  constructor(props: DeltaPageProps) {
    super(props);
    this.state = {
      patch: null,
      preview: null,
      previewLoading: true,
      resultingRelease: null,
    };
  }

  componentDidMount() {
    Patch.get(
      this.props.match.params.id
    ).then(
      patch => {
        this.setState(
          {
            patch,
            previewLoading: true,
          }
        );
        return patch;
      }
    ).then(
      patch => patch.preview().then(
        (preview) => {
          this.setState(
            {
              preview,
              previewLoading: false,
            }
          )
        }
      )
    );
  }

  handleApply = () => {
    this.state.patch.apply().then(
      (release: CubeRelease) => {
        this.setState(
          {
            resultingRelease: release,
          }
        )
      }
    )
  };

  render() {
    if (this.state.resultingRelease) {
      return <Redirect
        to={'/release/' + this.state.resultingRelease.id}
      />
    }

    let preview = <Loading/>;
    if (this.state.preview) {
      preview = <PatchPreview
        preview={this.state.preview}
      />;
    }

    return <Container fluid>
      <Row>
        <Button
          onClick={this.handleApply}
          disabled={!this.state.patch}
        >
          Apply
        </Button>
        {preview}
      </Row>
    </Container>;

  }

}