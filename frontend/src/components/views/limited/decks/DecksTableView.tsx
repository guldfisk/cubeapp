import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {Link} from "react-router-dom";

import {FullDeck, LimitedSession, TournamentRecord, User} from "../../../models/models";
import {DateListItem} from "../../../utils/listitems";


interface DecksTableViewProps {
  decks: FullDeck[]
}

interface DecksTableViewState {
}


export default class DecksTableView extends React.Component<DecksTableViewProps, DecksTableViewState> {

  constructor(props: DecksTableViewProps) {
    super(props);
    this.state = {};
  }


  render() {

    const columns: { [key: string]: any } = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'name',
        text: 'Name',
        formatter: (cell: string, row: FullDeck, rowIndex: number, formatExtraData: any) => <Link
          to={'/pools/' + row.poolId + '/'}
        >
          {cell}
        </Link>,
      },
      {
        dataField: 'limitedSession',
        text: 'Session',
        formatter: (cell: LimitedSession, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/limited/' + cell.id + '/'}
        >
          {cell.name}
        </Link>,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '20%', textAlign: 'center'};
        },
      },
      {
        dataField: 'user',
        text: 'Player',
        formatter: (cell: User, row: any, rowIndex: number, formatExtraData: any) => cell.username,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12%', textAlign: 'center'};
        },
      },
      {
        dataField: 'record',
        text: 'Record',
        formatter: (cell: TournamentRecord, row: any, rowIndex: number, formatExtraData: any) => cell.asString(),
        headerStyle: (column: any, colIndex: number) => {
          return {width: '8%', textAlign: 'center'};
        },
      },
      {
        dataField: 'createdAt',
        text: 'Created',
        formatter: (cell: Date, row: any, rowIndex: number, formatExtraData: any) => <DateListItem
          date={cell}
        />,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '7%', textAlign: 'center'};
        },
      },

    ];

    return <BootstrapTable
      keyField='id'
      data={this.props.decks}
      columns={columns}
      bootstrap4
      condensed
    />
  }

}

