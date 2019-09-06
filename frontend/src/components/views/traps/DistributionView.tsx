import React from 'react';
import Button from "react-bootstrap/Button";
import Chart from "react-apexcharts";
import store from "../../state/store";
import {Patch, Preview, VerbosePatch} from "../../models/models";
import {Loading} from "../../utils/utils";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";


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
      status: 'prerun',
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

  handleUnpackedMessage = (message: any) => {
    if (message.type == 'status') {
      this.setState({status: message.status});
    } else if (message.type == 'previous_messages') {
      let status = this.state.status;
      let data = [];
      for (const subMessage of message.messages) {
        if (subMessage.type == 'status') {
          status = subMessage.status
        } else if (subMessage.type === 'frame') {
          data.push(subMessage.frame[0])
        }
      }
      this.setState(
        {
          status: status,
          data: this.state.data.concat(data)
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

  render() {

    let controlPanel = <Loading/>;
    if (this.state.status === 'prerun') {
      controlPanel = <Button
        onClick={() => this.submitMessage({type: 'start'})}
      >
        Start Distribution
      </Button>
    }

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
            // width='50%'
          />
        </Col>
      </Row>
    </Container>
  }
}
