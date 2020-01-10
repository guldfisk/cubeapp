import React from 'react';

import {WishList} from '../../models/models';

import Col from "react-bootstrap/Col";
import PaginationBar from "../../utils/PaginationBar";
import WishListsView from "../../views/wishes/WishListsView";


const pageSize: number = 10;


interface WishListsPageState {
  wishLists: WishList[]
  offset: number
  hits: number
}


export default class WishListsPage extends React.Component<null, WishListsPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      wishLists: [],
      offset: 0,
      hits: 0,
    };
  }

  componentDidMount() {
    this.fetchWishLists(0);
  }

  fetchWishLists = (offset: number) => {
    WishList.all(
      offset,
      pageSize,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            wishLists: objects,
            hits,
          }
        )
      }
    );
  };

  render() {

    return <Col>
      <PaginationBar
        hits={this.state.hits}
        offset={this.state.offset}
        handleNewOffset={this.fetchWishLists}
        pageSize={pageSize}
        maxPageDisplay={7}
      />
      <WishListsView wishLists={this.state.wishLists} />
    </Col>
  }

}
