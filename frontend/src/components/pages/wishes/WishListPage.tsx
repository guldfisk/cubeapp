import React from 'react';

import {Loading} from '../../utils/utils';
import {WishList} from '../../models/models';
import WishListView from "../../views/wishes/WishListView";


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

  componentDidMount() {
    WishList.get(this.props.match.params.id).then(
      wishlist => {
        this.setState({wishlist});
      }
    );
  }

  render() {
    let wishlist = <Loading/>;
    if (this.state.wishlist !== null) {
      wishlist = <WishListView
        wishlist={this.state.wishlist}
      />
    }

    return wishlist;
  }

}
