import React from 'react';
import Chart from "react-apexcharts";


interface DistributionViewProps {
  data: number[],
}


export default class DistributionView extends React.Component<DistributionViewProps> {

  render() {
    return <Chart
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
            max: this.props.data.length,
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
            data: this.props.data,
          },
        ]
      }
    />
  }
}
