import React from 'react';
import Chart from "react-apexcharts";

import {
  CardboardCubeableRatingHistoryPoint,
  NodeRatingComponentRatingHistoryPoint
} from "../../models/models";


interface RatingHistoryViewProps {
  ratings: [string, (CardboardCubeableRatingHistoryPoint | NodeRatingComponentRatingHistoryPoint)[]][],
  average?: number | null,
  field?: string
  xLabel?: string
}


export default class RatingHistoryView extends React.Component<RatingHistoryViewProps> {

  public static defaultProps = {
    field: 'rating',
    xLabel: 'Ratings',
  };

  render() {
    const releaseMarkers: { [key: string]: string } = {};
    this.props.ratings.map(
      ([name, series]) => {
        series.filter(rating => rating.ratingMap.eventType == 'release').map(
          rating => releaseMarkers[rating.ratingMap.createdAt.getTime()] = rating.ratingMap.release.name
        )
      }
    )
    return <Chart
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
              text: this.props.xLabel,
            },
          },
          tooltip: {
            shared: true,
          },
          theme: {mode: 'dark'},
          annotations: {
            yaxis: this.props.average ? [
              {
                y: this.props.average,
                label: {
                  style: {
                    color: 'black',
                    background: '#00E396'
                  },
                  text: 'Average',
                }
              }
            ] : [],
            xaxis: Object.entries(releaseMarkers).map(
              ([time, name]) => {
                return {
                  x: time,
                  label: {
                    style: {
                      color: 'black',
                      background: '#00E396'
                    },
                    text: name,
                  },
                }
              }
            )
          },
        }
      }
      series={
        this.props.ratings.map(
          ([name, series]) => {
            return {
              name: name,
              data: series.map(
                rating => [rating.ratingMap.createdAt.getTime(), (rating as any)[this.props.field]]
              )
            }
          }
        )
      }
    />
  }
}
