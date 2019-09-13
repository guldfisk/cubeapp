import React from 'react';
import Button from "react-bootstrap/Button";
import Chart from "react-apexcharts";
import store from "../../state/store";
import {Patch, Preview, VerbosePatch} from "../../models/models";
import {Loading} from "../../utils/utils";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import {string} from "prop-types";


interface DistributionViewProps {
  id: number
}

interface TestPageState {
  ws: WebSocket | null
  data: number[]
  status: string
}


export default class DistributionView extends React.Component<DistributionViewProps, TestPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      ws: null,
      data: [],
      status: 'stopped',
    };
  }

  componentWillUnmount(): void {
    if (this.state.ws && this.state.ws.OPEN) {
      this.state.ws.close();
    }
  }

  componentDidMount() {
    const url = new URL('/ws/distribute/' + this.props.id + '/', window.location.href);
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

  handleUnpackedMessage = (message: any) => {
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
    }
  };

  handleMessage = (event: any) => {
    const message = JSON.parse(event.data);
    console.log('new message', message);
    this.handleUnpackedMessage(message);
  };

  submitMessage = (message: any) => {
    this.state.ws.send(JSON.stringify(message));
  };

  private static statusActionMap: Record<string, string[]> = {
    running: ['stop', 'pause'],
    pausing: ['stop', 'resume'],
    resuming: ['stop', 'pause'],
    paused: ['stop', 'resume'],
    stopping: [],
    completed: [],
    prerun: ['start'],
    stopped: ['start'],
    busy: ['start'],
  };

  render() {

    let controlPanel = <div>
      {
        DistributionView.statusActionMap[this.state.status].map(
          action => <Button
            onClick={
              () => {
                console.log(action);
                this.submitMessage({type: action});
              }
            }
          >
            {action}
          </Button>
        )
      }
    </div>;
    // if (this.state.status === 'prerun') {
    //   controlPanel = <Button
    //     onClick={() => this.submitMessage({type: 'start'})}
    //   >
    //     Start Distribution
    //   </Button>
    // } else if (this.state.status === 'started') {
    //   controlPanel = <Button
    //     onClick={() => this.submitMessage({type: 'stop'})}
    //   >
    //     Stop
    //   </Button>
    // } else if (this.state)

    return <Container fluid>
      <Row>
        <Col sm={2}>
          <label>{this.state.status}</label>
          {controlPanel}
        </Col>
        <Col>
          <Chart
            type='line'
            options={
              {
                chart: {
                  id: 'chart',
                  animations: {enabled: false}
                },
                xaxis: {
                  type: 'numeric',
                  min: 0,
                  max: this.state.data.length,
                  crosshairs: {show: false},
                  axisTicks: {color: 'white'},
                  tooltip: {enabled: false},
                  title: {
                    text: "Generation",
                    color: "white",
                  }
                },
                yaxis: {
                  title: {
                    text: "Fitness",
                    color: "white",
                  },
                  min: 0,
                  max: 1,
                  crosshairs: {show: false},
                  axisTicks: {color: 'white'},
                  tooltip: {enabled: false},
                }
              }
            }
            series={
              [
                {
                  name: 'something',
                  data: this.state.data,
                },
              ]
            }
          />
        </Col>
      </Row>
    </Container>
  }
}
