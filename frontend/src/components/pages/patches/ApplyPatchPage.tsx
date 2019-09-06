import React from 'react';
import {CubeRelease, Patch, Preview, UpdateReport, VerbosePatch} from "../../models/models";
import {Loading} from "../../utils/utils";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import {Container} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import {Redirect} from "react-router";
import PatchPreview from "../../views/patchview/PatchPreview";
import PatchMultiView from "../../views/patchview/PatchMultiView";
import ReportView from "../../views/report/ReportView";
import DistributionView from "../../views/traps/DistributionView";


interface DeltaPageProps {
  match: any
}

interface ApplyPatchPageState {
  patch: null | Patch
  verbosePatch: null | VerbosePatch
  report: null | UpdateReport
  preview: null | Preview
  previewLoading: boolean
  resultingRelease: null | CubeRelease
}

export default class ApplyPatchPage extends React.Component<DeltaPageProps, ApplyPatchPageState> {

  constructor(props: DeltaPageProps) {
    super(props);
    this.state = {
      patch: null,
      verbosePatch: null,
      report: null,
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
      patch => {
        patch.preview().then(
          (preview) => {
            this.setState(
              {
                preview,
                previewLoading: false,
              }
            )
          }
        );
        patch.verbose().then(
          verbosePatch => this.setState({verbosePatch})
        );
        patch.report().then(
          report => this.setState({report})
        );
      }
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

    const reportView = (
      !this.state.report ? <Loading/> :
        <ReportView
          report={this.state.report}
        />
    );


    // let patchView = <Loading/>;
    // if (this.state.patch !== null) {
    //   patchView = <PatchMultiView
    //     patch={this.state.patch}
    //     verbosePatch={this.state.verbosePatch}
    //   />
    // }
    //
    // let preview = <Loading/>;
    // if (this.state.preview) {
    //   preview = <PatchPreview
    //     preview={this.state.preview}
    //     noHover={false}
    //   />;
    // }

    return <DistributionView id={this.props.match.params.id}/>;
    // return <Container fluid>
    //   <Row>
    //     <Button
    //       onClick={this.handleApply}
    //       disabled={!this.state.patch}
    //     >
    //       Apply
    //     </Button>
    //   </Row>
    //   <Row>
    //     <DistributionView id={this.props.match.params.id}/>
    //   </Row>
    //   <Row>
    //     <Card>
    //       <Card.Header>
    //         Report
    //       </Card.Header>
    //       <Card.Body>
    //         {reportView}
    //       </Card.Body>
    //     </Card>
    //   </Row>
    //   <Row>
    //     <Card>
    //       <Card.Header>
    //         Delta
    //       </Card.Header>
    //       <Card.Body>
    //         {/*{patchView}*/}
    //       </Card.Body>
    //     </Card>
    //   </Row>
    //   <Row>
    //     {/*{preview}*/}
    //   </Row>
    // </Container>;

  }

}