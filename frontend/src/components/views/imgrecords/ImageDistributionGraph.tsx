import React from 'react';
import Chart from "react-apexcharts";
import {roundToN} from "../../utils/utils";


interface ImageDistributionGraphProps {
  probabilities: { probabilityDistributionPoints: [number, number][], cumulativePoints: [number, number][] }
  highlightImageQuantity?: number | null
}


export default class ImageDistributionGraph extends React.Component<ImageDistributionGraphProps> {

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
            title: {
              text: 'Pack image sum',
            }
          },
          yaxis: {
            title: {
              text: 'probability',
            },
          },
          tooltip: {
            shared: true,
          },
          theme: {mode: 'dark'},
          annotations: this.props.highlightImageQuantity === null ? null : {
            xaxis: [
              {
                x: this.props.highlightImageQuantity,
                label: {
                  text: 'Pack total images',
                  style: {
                    color: 'black',
                    background: '#00E396'
                  },
                }
              }
            ]
          }
        }
      }
      series={
        [
          {
            name: 'Probability distribution',
            data: this.props.probabilities.probabilityDistributionPoints.map(
              ([x, y]) => [x, roundToN(y, 7)]
            ),
          },
          {
            name: 'Cumulative probability',
            data: this.props.probabilities.cumulativePoints.map(
              ([x, y]) => [x, roundToN(y, 7)]
            ),
          },
        ]
      }
    />
  }
}
