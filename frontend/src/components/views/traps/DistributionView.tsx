import React from 'react';
import Chart from "react-apexcharts";


interface DistributionViewProps {
  dataSeriesLabels: string[],
  data: number[][],
}


export default class DistributionView extends React.Component<DistributionViewProps> {

  render() {
    return <Chart
      type='line'
      options={
        {
          chart: {
            id: 'chart',
            animations: {enabled: false},
          },
          xaxis: {
            type: 'numeric',
            title: {
              text: "Generation",
            },
            min: 0,
            max: this.props.data.length ? this.props.data[0].length : 1,
          },
          yaxis: {
            title: {
              text: "Fitness",
            },
            min: 0,
            max: 1,
          },
          theme: {mode: 'dark'},
        }
      }
      series={
        this.props.dataSeriesLabels.map(
          (label, index) => {
            return {
              name: label,
              data: [0].concat(this.props.data[index]).map((v, idx) => [idx, v]),
            }
          }
        )
      }
    />
  }
}
