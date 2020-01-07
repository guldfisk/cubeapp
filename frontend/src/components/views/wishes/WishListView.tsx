import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';

import {Wish, WishList} from '../../models/models';
import WishView from "./WishView";


interface WishListViewProps {
  wishlist: WishList;
  deleteWish: (wish: Wish) => void;
}


export default class WishListView extends React.Component<WishListViewProps> {

  render() {

    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'cardboards',
        text: 'Cardboards',
      },
      {
        dataField: 'weight',
        text: 'Weight',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5em', textAlign: 'center'};
        }
      },
      {
        dataField: 'createdAt',
        text: 'Created At',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        }
      },
      {
        dataField: 'updatedAt',
        text: 'Updated At',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        }
      },
      {
        dataField: 'delete',
        text: 'Delete',
        isDummyField: true,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <i
          className="fa fa-times-circle"
          onClick={() => this.props.deleteWish(row.wish)}
        />,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5em', textAlign: 'center'};
        },
      },
    ];

    const data = this.props.wishlist.wishes.sort(
      (a, b) => a.weight > b.weight ? -1 : a.weight < b.weight ? 1 : 0
    ).map(
      wish => {
        return {
          id: wish.id,
          weight: wish.weight,
          createdAt: wish.createdAt,
          updatedAt: wish.updatedAt,
          cardboards: <WishView wish={wish}/>,
          wish: wish,
        }
      }
    );

    return <BootstrapTable
      keyField='id'
      data={data}
      columns={columns}
      bootstrap4
      condensed
      pagination={
        paginationFactory(
          {
            hidePageListOnlyOnePage: true,
            showTotal: true,
            sizePerPage: 40,
          }
        )
      }
    />
  }

}
