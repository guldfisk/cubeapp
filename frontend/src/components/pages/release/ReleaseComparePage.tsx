import React from 'react';
import {CubeRelease, Patch, UpdateReport, VerbosePatch} from "../../models/models";
import PatchMultiView from "../../views/patchview/PatchMultiView";
import {Loading} from "../../utils/utils";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import store from "../../state/store";
import ReportView from "../../views/report/ReportView";


interface ReleaseComparePageProps {
  match: any
}


interface ReleaseComparePageState {
  patch: Patch | null
  verbosePatch: VerbosePatch | null
  report: UpdateReport | null
  pdfUrl: string | null
  ws: WebSocket | null
  generating: boolean
}


export default class ReleaseComparePage extends React.Component<ReleaseComparePageProps, ReleaseComparePageState> {

  constructor(props: ReleaseComparePageProps) {
    super(props);
    this.state = {
      patch: null,
      verbosePatch: null,
      report: null,
      pdfUrl: null,
      ws: null,
      generating: false,
    }
  }

  componentWillUnmount(): void {
    if (this.state.ws && this.state.ws.OPEN) {
      this.state.ws.close();
    }
  }

  componentDidMount(): void {
    CubeRelease.compare(
      this.props.match.params.id_from,
      this.props.match.params.id,
    ).then(
      ([patch, verbosePatch, pdfUrl, report]) => {
        this.setState(
          {patch, verbosePatch, pdfUrl, report},
          this.connectWs,
        )
      }
    )
  }

  handleMessage = (event: any) => {
    const message = JSON.parse(event.data);

    if (message.type === 'delta_pdf_update') {
      this.setState({pdfUrl: message.pdf_url, generating: false})

    } else if (message.type === 'status' && message.status === 'generating') {
      this.setState({generating: true})

    }

  };

  connectWs = (): void => {
    if (this.state.pdfUrl) {
      return
    }

    const url = new URL(
      '/ws/delta_pdf_from/' + this.props.match.params.id_from + '/to/' + this.props.match.params.id + '/',
      window.location.href,
    );
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
  };


  render() {
    const pdfButton = this.state.pdfUrl ?
      <a
        href={this.state.pdfUrl}
        title="Download pdf"
        download="new_laps.pdf"
      >
        <Button>
          Download new laps pdf
        </Button>
      </a> : this.state.generating ?
        <Button
          disabled={true}
        >Generating</Button> :
        <Button
          disabled={!this.state.ws}
          onClick={
            () => this.state.ws.send(
              JSON.stringify({type: 'generate'})
            )
          }
        >
          Generate new laps pdf
        </Button>
    ;

    return <Container
      fluid
    >
      <Row>
        <Col>
          {pdfButton}
        </Col>
      </Row>
      <Row>
        <Col>
          {this.state.report ? <ReportView report={this.state.report}/> : <Loading/>}
        </Col>
      </Row>
      <Row>
        <Col>
          {
            !this.state.patch ? <Loading/> : <PatchMultiView
              patch={this.state.patch}
              verbosePatch={this.state.verbosePatch}
            />
          }
        </Col>
      </Row>
    </Container>;
  }

}