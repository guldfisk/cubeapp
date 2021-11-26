import React from 'react';

import {Container, Row} from 'react-bootstrap';
import {Link} from "react-router-dom";

import RatingMapComponentsView from "../../views/rating/RatingMapComponentsView";
import RatingMapStatsView from "../../views/rating/RatingMapStatsView";
import RatingMapView from "../../views/rating/RatingMapView";
import RoutedTabs from "../../utils/RoutedTabs";
import {Loading, NotFound} from '../../utils/utils';
import {RatingMap} from '../../models/models';


interface RatingMapPageProps {
  match: any
}


interface RatingMapPageState {
  ratingMap: RatingMap | null
  error: any
}


export default class RatingMapPage extends React.Component<RatingMapPageProps, RatingMapPageState> {

  constructor(props: RatingMapPageProps) {
    super(props);
    this.state = {
      ratingMap: null,
      error: null,
    };
  }

  componentDidMount() {
    RatingMap.get(this.props.match.params.id).then(
      ratingMap => {
        this.setState(
          {ratingMap},
        )
      }
    ).catch(error => this.setState({error}));
  }

  render() {
    if (this.state.ratingMap === null) {
      if (this.state.error) {
        return <NotFound/>
      }
      return <Loading/>
    }

    return <Container>
      <Row>
        <h3>
          Ratings for <Link to={"/release/" + this.state.ratingMap.release.id}>
          {this.state.ratingMap.explain()}
        </Link>
        </h3>
      </Row>
      {
        this.state.ratingMap.parent && <Row>
          <span>Previous: </span>
          <Link to={"/rating-map/" + this.state.ratingMap.parent.id}>
            {this.state.ratingMap.parent.explain()}
          </Link>
        </Row>
      }
      {
        this.state.ratingMap.children.length !== 0 && <Row>
          <>
            <span>Children: </span>
            <ul>
              {
                this.state.ratingMap.children.map(
                  child => <li>
                    <Link to={"/rating-map/" + child.id}>
                      {child.explain()}
                    </Link>
                  </li>
                )
              }
            </ul>
          </>
        </Row>
      }
      <Row>
        <RoutedTabs
          match={this.props.match}
          tabs={
            [
              [
                'ratings',
                'Ratings',
                () => <RatingMapView ratingMap={this.state.ratingMap}/>,
              ],
              [
                'node-components',
                'Node Components',
                () => <RatingMapComponentsView ratingMap={this.state.ratingMap}/>,
              ],
              [
                'stats',
                'Stats',
                () => <RatingMapStatsView ratingMap={this.state.ratingMap}/>,
              ],
            ]
          }
          defaultTab="ratings"
        />
      </Row>
    </Container>
  }
}
