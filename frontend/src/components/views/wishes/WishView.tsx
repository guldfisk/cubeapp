import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';

import {CardboardWish, Requirement, Wish} from '../../models/models';
import RequirementsView from "./RequirementsView";
import {CardboardListItem} from "../../utils/listitems";

import '../../../styling/WishView.css';


interface WishViewProps {
  wish: Wish;
  onCardboardWishMinimumAmountChange?: (cardboardWish: CardboardWish, minimumAmount: number) => void
  onCardboardWishDelete?: (cardboardWish: CardboardWish) => void
  onRequirementDelete?: (requirement: Requirement) => void
  onAddRequirement?: (cardboardWish: CardboardWish) => void
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
        dataField: 'cardboard',
        text: 'Name',
        editable: false,
      },
      {
        dataField: 'minimumAmount',
        text: 'Qty',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '4em', textAlign: 'center'};
        },
        validator: (newValue: string, row: any, column: any): any => {
          if (
            /^\d+$/.exec(newValue)
          ) {
            if (parseInt(newValue) <= 0) {
              return {
                valid: false,
                message: 'Value must be greater than zero',
              }
            }
            return true
          }
          return {
            valid: false,
            message: 'Invalid number'
          }
        },
      },
      {
        dataField: 'requirements',
        text: 'Requirements',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        },
        editable: false,
      },
      {
        dataField: 'createdAt',
        text: 'Created At',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        },
        editable: false,
      },
      {
        dataField: 'updatedAt',
        text: 'Updated At',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        },
        editable: false,
      },
      {
        dataField: 'delete',
        text: 'Delete',
        isDummyField: true,
        editable: false,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <i
          className="fa fa-times-circle"
          onClick={() => this.props.onCardboardWishDelete && this.props.onCardboardWishDelete(row.cardboardWish)}
        />,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '2em', textAlign: 'center'};
        }
      },
    ];

    const data = this.props.wish.cardboardWishes.map(
      cardboardWish => {
        return {
          cardboardWish: cardboardWish,
          id: cardboardWish.id,
          cardboard: <CardboardListItem cardboard={cardboardWish.cardboard} multiplicity={1}/>,
          minimumAmount: cardboardWish.minimumAmount,
          createdAt: cardboardWish.createdAt,
          updatedAt: cardboardWish.updatedAt,
          requirements: <RequirementsView
            cardboardWish={cardboardWish}
            onRequirementDelete={this.props.onRequirementDelete}
            onAddRequirement={this.props.onAddRequirement && (() => this.props.onAddRequirement(cardboardWish))}
          />,
        }
      }
    );

    return <BootstrapTable
      keyField='id'
      data={data}
      columns={columns}
      bootstrap4
      condensed
      classes="hide-header light-table"
      cellEdit={
        this.props.onCardboardWishMinimumAmountChange ? cellEditFactory(
          {
            mode: 'click',
            beforeSaveCell: (
              (oldValue: any, newValue: any, row: any, column: any) => {
                if (oldValue == newValue) {
                  return;
                }
                this.props.onCardboardWishMinimumAmountChange(
                  row.cardboardWish,
                  parseInt(newValue),
                );
              }
            ),
            blurToSave: true,
          }
        ) : undefined
      }
    />

  }

}
