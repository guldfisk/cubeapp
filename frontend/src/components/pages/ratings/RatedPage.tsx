import React from 'react';

import {Link} from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import {Loading} from '../../utils/utils';
import {
  Cardboard,
  CardboardCubeableRating,
  CardboardCubeableRatingHistoryPoint, CardboardTrap, NodeRatingComponentRatingHistoryPoint,
} from '../../models/models';
import {ImageableImage} from "../../images";
import RatingHistoryView from "../../views/rating/RatingHistoryView";


interface RatedPageProps {
  match: any
}


interface RatedPageState {
  rating: CardboardCubeableRating | null
  ratings: CardboardCubeableRatingHistoryPoint[]
  nodeRatings: [string, NodeRatingComponentRatingHistoryPoint[]][]
}


export default class RatedPage extends React.Component<RatedPageProps, RatedPageState> {

  constructor(props: RatedPageProps) {
    super(props);
    this.state = {
      rating: null,
      ratings: [],
      nodeRatings: [],
    };
  }

  componentDidMount() {
    CardboardCubeableRating.getForRelease(
      this.props.match.params.releaseId,
      this.props.match.params.cardboardCubeableId,
    ).then(
      rating => {
        this.setState({rating});
        if (rating.cardboardCubeable instanceof CardboardTrap) {
          Promise.all(
            (rating.cardboardCubeable as CardboardTrap).node.children.items.map(
              ([node, multiplicity]) => NodeRatingComponentRatingHistoryPoint.getNodeHistory(
                this.props.match.params.releaseId,
                node.id,
              ).then(series => [node.representation(), series])
            )
          ).then(
            (nodeRatings: any) => this.setState({nodeRatings})
          )
        }
      }
    );
    CardboardCubeableRatingHistoryPoint.getHistory(
      this.props.match.params.releaseId,
      this.props.match.params.cardboardCubeableId,
    ).then(
      ratings => this.setState({ratings})
    );
  }

  render() {

    return <Container fluid>
      <Row>
        {
          this.state.rating ? <>
            <Col>
              <ImageableImage
                imageable={this.state.rating.exampleCubeable}
              />
            </Col>
            {
              this.state.rating.cardboardCubeable instanceof CardboardTrap && <Col>
                <span>Nodes</span>
                <ul>
                  {
                    (this.state.rating.cardboardCubeable as CardboardTrap).node.children.items.map(
                      ([node, multiplicity]) => <li>
                        <Link
                          to={
                            '/release/'
                            + this.props.match.params.releaseId
                            + '/node-details/'
                            + (node instanceof Cardboard ? node.name : node.id)
                          }
                        >
                          {
                            node instanceof Cardboard ? node.name : node.representation()
                          }
                        </Link>
                      </li>
                    )
                  }
                </ul>
              </Col>
            }
          </> : <Loading/>
        }
      </Row>
      <Row>
        {
          this.state.ratings.length !== 0 ? <RatingHistoryView
            ratings={[[this.state.rating.exampleCubeable.representation(), this.state.ratings]]}
            average={1000}
          /> : <Loading/>
        }
      </Row>
      <Row>
        {
          this.state.nodeRatings.length !== 0 ? <RatingHistoryView
            ratings={this.state.nodeRatings}
          /> : null
        }
      </Row>
    </Container>

  }

}