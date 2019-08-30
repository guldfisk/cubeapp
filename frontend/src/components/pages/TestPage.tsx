import React from 'react';
import Button from "react-bootstrap/Button";
import Chart from "react-apexcharts";


const url: string = 'ws://localhost:7000/ws/distribute/4/';


interface TestPageState {
  ws: WebSocket
  data: number[]
}


export default class TestPage extends React.Component<null, TestPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      ws: new WebSocket(url),
      data: [],
    }
  }

  componentDidMount() {
    this.state.ws.onopen = () => {
      console.log('connected')
    };

    this.state.ws.onmessage = evt => {
      const frame = JSON.parse(evt.data);
      console.log(frame);
      // this.setState({data: this.state.data.concat([frame.message])})
    };

    this.state.ws.onclose = () => {
      console.log('disconnected');
      this.setState({
          ws: new WebSocket(url),
        }
      )
    }
  }

  submitMessage = () => {
    const message = {message: 'okokok'};
    this.state.ws.send(JSON.stringify(message));
  };

  render() {
    return (
      <div>
        <Button onClick={() => console.log('ok')}>Send message</Button>
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
          width='50%'
        />
      </div>
    )
  }
}
