import React from 'react';
import Chart from "react-apexcharts";

import {CardboardStatHistory} from "../../models/models";
import {MultiValue} from "react-select";
import {StatSelector} from "./StatSelector";


interface StatHistoryViewProps {
  stats: CardboardStatHistory,
}

interface StatHistoryViewState {
  columns: MultiValue<{ value: string, label: string }>

}


export default class StatHistoryView extends React.Component<StatHistoryViewProps, StatHistoryViewState> {

  constructor(props: StatHistoryViewProps) {
    super(props);
    this.state = {
      columns: [{value: 'maindeck_win_rate', label: 'Maindeck Win Rate'}]
    };
  }

  render() {

    return <>
      <StatSelector
        value={this.state.columns}
        onChange={(columns) => this.setState({columns})}
      />
      <Chart
        type='line'
        options={
          {
            chart: {
              id: 'chart',
              animations: {enabled: false}
            },
            xaxis: {
              type: 'datetime',
              title: {
                text: 'Date',
              }
            },
            yaxis: {
              title: {
                text: 'Value',
              },
              min: 0,
            },
            tooltip: {
              shared: true,
            },
            theme: {mode: 'dark'},
          }
        }
        series={
          Object.entries(this.props.stats.stats).filter(
            ([name]) => this.state.columns.some(v => v.value == name)
          ).map(
            ([name, series]) => {
              return {
                name,
                data: series.map(
                  ([date, value]) => [date.getTime(), value]
                )
              }
            }
          )
        }
      />
    </>
  }
}
