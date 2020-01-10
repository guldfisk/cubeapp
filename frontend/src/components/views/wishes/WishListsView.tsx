import React from 'react';

import {Link} from "react-router-dom";

import Table from "react-bootstrap/Table";
import {WishList} from "../../models/models";


interface WishListsViewProps {
  wishLists: WishList[]
}


export default class WishListsView extends React.Component<WishListsViewProps> {

  render() {
    return <Table>
      <thead>
      <tr>
        <th>Name</th>
        <th>Created At</th>
        <th>Updated At</th>
      </tr>
      </thead>
      <tbody>
        {
         this.props.wishLists.map(
           wishlist => {
             return <tr>
               <td>
                 <Link to={"/wishlist/" + wishlist.id}>
                   {wishlist.name}
                 </Link>
               </td>
               <td>{wishlist.createdAt}</td>
               <td>{wishlist.updatedAt}</td>
             </tr>
           }
         )
        }
      </tbody>
    </Table>

  }

}
