import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {Wish} from '../../models/models';
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import '../../../styling/WishView.css';
import RequirementsView from "./RequirementsView";


interface WishViewProps {
  wish: Wish;
}


export default class WishView extends React.Component<WishViewProps> {

  render() {
    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'cardboardName',
        text: 'Name',
      },
      {
        dataField: 'minimumAmount',
        text: 'Qty',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '2em', textAlign: 'center'};
        },
      },
      {
        dataField: 'requirements',
        text: 'Requirements',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
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
          onClick={() => console.log('clicked !!')}
        />,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '2em', textAlign: 'center'};
        }
      },
    ];

    const data = this.props.wish.cardboardWishes.map(
      cardboardWish => {
        return {
          id: cardboardWish.id,
          cardboardName: cardboardWish.cardboardName,
          minimumAmount: cardboardWish.minimumAmount,
          createdAt: cardboardWish.createdAt,
          updatedAt: cardboardWish.updatedAt,
          requirements: <RequirementsView cardboardWish={cardboardWish} />,
        }
      }
    );

    return <BootstrapTable
      keyField='id'
      data={data}
      columns={columns}
      bootstrap4
      condensed
      // striped
      classes="hide-header light-table"
    />

  }

}
