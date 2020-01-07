import React from 'react';

import {Link} from "react-router-dom";

import {Loading} from '../utils/utils';
import {Wish, WishList} from '../models/models';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import WishListView from "../views/wishes/WishListView";


interface WishListPageProps {
  match: any
}

interface WishListPageState {
  wishlist: WishList | null
}

export default class WishListPage extends React.Component<WishListPageProps, WishListPageState> {

  constructor(props: WishListPageProps) {
    super(props);
    this.state = {
      wishlist: null,
    };
  }

  reload = (): void => {
    WishList.get(this.props.match.params.id).then(
      wishlist => {
        this.setState({wishlist})
      }
    );
  };

  componentDidMount() {
    this.reload();
  }

  createWish = () => {
    this.state.wishlist.createWish(12).then(
      this.reload
    )
  };

  render() {
    let wishlist = <Loading/>;
    if (this.state.wishlist !== null) {
      wishlist = <WishListView
        wishlist={this.state.wishlist}
        deleteWish={wish => wish.delete().then(this.reload)}
      />
    }

    return <Container fluid>
      <Row>
        <Col sm={2}>
          <Card>
            <Card.Header>
              Actions
            </Card.Header>
            <Card.Body>
              <a
                onClick={this.createWish}
              >Add wish</a>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          {wishlist}
        </Col>
      </Row>
    </Container>
  }

}
