import React from 'react';
import Chart from "react-apexcharts";

import {
  LogPoint
} from "../../models/models";
import {roundToN} from "../../utils/utils";


interface LogPointsViewProps {
  points: LogPoint[]
  yaxisTitle: string
}


export default class LogPointsView extends React.Component<LogPointsViewProps> {

  render() {
    return <Chart
      type='line'
      options={
        {
          chart: {
            id: 'chart',
            animations: {enabled: false}
          },
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          xaxis: {
            type: 'datetime',
            title: {
              text: 'Date',
            }
          },
          yaxis: {
            title: {
              text: this.props.yaxisTitle,
            },
          },
          tooltip: {
            shared: true,
          },
          theme: {mode: 'dark'},
        }
      }
      series={
        [
          ['1 day half life', 'valueShort'],
          ['4 day half life', 'valueMedium'],
          ['16 day half life', 'valueLong'],
        ].map(
          ([name, field, color]) => {
            return {
              name,
              data: this.props.points.map(
                point => [point.timestamp.getTime(), roundToN((point as any)[field], 5)]
              )
            }
          }
        )
      }
    />
  }
}
