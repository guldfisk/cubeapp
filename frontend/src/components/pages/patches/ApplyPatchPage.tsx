import React from 'react';
import {CubeRelease, DistributionPossibility, Patch, Preview, UpdateReport, VerbosePatch} from "../../models/models";
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
import PdfView from "../../views/pdf/PdfView";
import store from "../../state/store";
import Col from "react-bootstrap/Col";
import Chart from "react-apexcharts";
import DistributionPossibilitiesView from "../../views/traps/DistributionPossibilitiesView";
import TrapCollectionView from "../../views/traps/TrapCollectionView";
import DistributionPossibilityView from "../../views/traps/DistributionPossibilityView";


interface DeltaPageProps {
  match: any
}


interface ApplyPatchPageState {
  patch: null | Patch
  verbosePatch: null | VerbosePatch
  report: null | UpdateReport
  preview: null | Preview
  previewLoading: boolean
  resultingRelease: null | number
  distributionPossibilities: DistributionPossibility[]
  distributionPossibility: null | DistributionPossibility
  ws: WebSocket | null
  data: number[]
  status: string
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
      distributionPossibilities: [],
      distributionPossibility: null,
      ws: null,
      data: [],
      status: 'prerun',
    };
  }

  componentWillUnmount(): void {
    if (this.state.ws && this.state.ws.OPEN) {
      this.state.ws.close();
    }
  }

  componentDidMount() {
    const url = new URL('/ws/distribute/' + this.props.match.params.id + '/', window.location.href);
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
      this.setState({ws});
    };

    ws.onmessage = this.handleMessage;

    ws.onclose = () => {
      console.log('disconnected');
    }
  }

  setStatus = (status: string) => {
    if (status == 'stopped') {
      this.setState({data: [], status})
    } else {
      this.setState({status})
    }
  };

  handleMessage = (event: any) => {
    const message = JSON.parse(event.data);
    console.log('new message', message);

    if (message.type == 'status') {
      this.setStatus(message.status);

    } else if (message.type == 'previous_messages') {
      this.setState(
        {
          status: message.status,
          data: message.frames.map(([max, average]: [number, number]) => max),
        }
      )

    } else if (message.type === 'frame') {
      this.setState({data: this.state.data.concat(message.frame[0])})

    } else if (message.type === 'items') {
      this.setState(
        {
          distributionPossibilities: message.distributions.map(
            (distribution: any) => DistributionPossibility.fromRemote(distribution)
          ),
          patch: Patch.fromRemote(message.patch),
          preview: Preview.fromRemote(message.preview),
          report: UpdateReport.fromRemote(message.report),
          verbosePatch: VerbosePatch.fromRemote(message.verbose_patch),
        }
      )

    } else if (message.type === 'distribution_possibility') {
      this.setState(
        {
          distributionPossibilities: [DistributionPossibility.fromRemote(message.content)].concat(
            this.state.distributionPossibilities
          )
        }
      )

    } else if (message.type === 'distribution_pdf') {
      const possibilities = this.state.distributionPossibilities;
      for (const possibility of possibilities) {
        if (possibility.id === message.possibility_id) {
          possibility.pdfUrl = message.url;
          break;
        }
      }
      this.setState({distributionPossibilities: possibilities});

    } else if (message.type === 'update_success') {
      this.setState({resultingRelease: message.new_release})

    }

  };

  submitMessage = (message: any) => {
    this.state.ws.send(JSON.stringify(message));
  };

  handleDistributionPossibilityClicked = (possibility: DistributionPossibility): void => {
    this.setState({distributionPossibility: possibility});
  };

  private static statusActionMap: Record<string, string[]> = {
    running: ['stop', 'pause'],
    pausing: ['stop', 'resume'],
    resuming: ['stop', 'pause'],
    paused: ['stop', 'resume', 'capture'],
    stopping: [],
    completed: [],
    prerun: ['start'],
    stopped: ['start'],
    busy: ['start'],
  };

  render() {
    if (this.state.resultingRelease) {
      return <Redirect
        to={'/release/' + this.state.resultingRelease}
      />
    }

    const reportView = (
      !this.state.report ? <Loading/> :
        <ReportView
          report={this.state.report}
        />
    );

    let controlPanel = <div>
      {
        ApplyPatchPage.statusActionMap[this.state.status].map(
          action => <Button
            onClick={
              () => {
                this.submitMessage({type: action});
              }
            }
          >
            {action}
          </Button>
        )
      }
    </div>;

    let patchView = <Loading/>;
    if (this.state.patch !== null) {
      patchView = <PatchMultiView
        patch={this.state.patch}
        verbosePatch={this.state.verbosePatch}
      />
    }

    let preview = <Loading/>;
    if (this.state.preview) {
      preview = <PatchPreview
        preview={this.state.preview}
        noHover={false}
      />;
    }

    return <Container fluid>
      <Row>
        <Col sm={2}>
          <label>{this.state.status}</label>
          {controlPanel}
        </Col>
        <Col>
          {
            this.state.status === 'prerun' ? undefined :
              <DistributionView data={this.state.data}/>
          }
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              Distribution Possibilities
            </Card.Header>
            <Card.Body>
              <DistributionPossibilitiesView
                possibilities={this.state.distributionPossibilities}
                onPossibilityClick={this.handleDistributionPossibilityClicked}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          {
            !this.state.distributionPossibility ? undefined :
              <DistributionPossibilityView possibility={this.state.distributionPossibility}/>
          }
        </Col>
      </Row>

      <Row>
        <Card>
          <Card.Header>
            Report
          </Card.Header>
          <Card.Body>
            {reportView}
          </Card.Body>
        </Card>
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
      <Row>
        <Col>
          <Button
            onClick={
              () => {
                if (this.state.distributionPossibility) {
                  this.submitMessage(
                    {
                      type: 'apply',
                      possibility_id: this.state.distributionPossibility.id,
                    }
                  )
                } else {
                  this.submitMessage({type: 'apply'})

                }
              }
            }
            disabled={!this.state.patch}
            size='lg'
            block
          >
            Apply
          </Button>
        </Col>
      </Row>
    </Container>;

  }

}