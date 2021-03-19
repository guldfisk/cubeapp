import React from 'react';

import {Loading} from '../../utils/utils';
import {
  NodeRatingComponent, NodeRatingComponentRatingHistoryPoint, Printing
} from '../../models/models';
import RatingHistoryView from "../../views/rating/RatingHistoryView";


interface RatedNodePageProps {
  match: any
}


interface RatedNodePageState {
  rating: NodeRatingComponent | null
  ratings: NodeRatingComponentRatingHistoryPoint[]
}


export default class RatedNodePage extends React.Component<RatedNodePageProps, RatedNodePageState> {

  constructor(props: RatedNodePageProps) {
    super(props);
    this.state = {
      rating: null,
      ratings: [],
    };
  }

  componentDidMount() {
    NodeRatingComponent.getForRelease(
      this.props.match.params.releaseId,
      this.props.match.params.nodeId,
    ).then(
      rating => this.setState(
        {rating},
      )
    );
    NodeRatingComponentRatingHistoryPoint.getNodeHistory(
      this.props.match.params.releaseId,
      this.props.match.params.nodeId,
    ).then(
      ratings => this.setState({ratings})
    );
  }

  render() {

    return <>
      {
        this.state.rating
          ? <h3>
            {
              this.state.rating.exampleNode instanceof Printing
                ? this.state.rating.exampleNode.name
                : this.state.rating.exampleNode.representation()
            }
        </h3> : <Loading/>
      }
      {
        this.state.ratings.length !== 0 ? <RatingHistoryView
          ratings={this.state.ratings}
        /> : <Loading/>
      }
    </>

  }

}