import React from 'react';
import Chart from "react-apexcharts";

import {
  CardboardCubeableRatingHistoryPoint,
  NodeRatingComponentRatingHistoryPoint
} from "../../models/models";


interface RatingHistoryViewProps {
  ratings: (CardboardCubeableRatingHistoryPoint | NodeRatingComponentRatingHistoryPoint)[],
  average?: number | null,
}


export default class RatingHistoryView extends React.Component<RatingHistoryViewProps> {

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
            type: 'datetime',
            title: {
              text: "Date",
            }
          },
          yaxis: {
            title: {
              text: "Rating",
            },
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
            xaxis: this.props.ratings.filter(rating => rating.ratingMap.eventType == 'release').map(
              rating => {
                return {
                  x: rating.ratingMap.createdAt.getTime(),
                  label: {
                    style: {
                      color: 'black',
                      background: '#00E396'
                    },
                    text: rating.ratingMap.release.name,
                  },
                }
              }
            )
          },
        }
      }
      series={
        [
          {
            name: 'Ratings',
            data: this.props.ratings.map(
              rating => [rating.ratingMap.createdAt.getTime(), rating.rating]
            )
          }
        ]
      }
    />
  }
}
