import React from 'react';

import {MatchPlayer, MatchResult, User} from "../../models/models";
import BootstrapTable from 'react-bootstrap-table-next';


interface MatchPlayersViewProps {
  players: MatchPlayer[]
}

class MatchPlayersView extends React.Component<MatchPlayersViewProps> {

  render() {
    const columns: { [key: string]: any } = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'user',
        text: 'Name',
        formatter: (cell: User, row: any, rowIndex: number, formatExtraData: any) => cell.username,
      },
      {
        dataField: 'wins',
        text: 'Wins',
      },
    ];
    return <BootstrapTable
      remote
      keyField='id'
      data={this.props.players}
      columns={columns}
      bootstrap4
      condensed
    />
  }
}


interface ResultsViewProps {
  results: MatchResult[]
}


export default class MatchResultsView extends React.Component<ResultsViewProps> {

  render() {

    const columns: { [key: string]: any } = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'players',
        text: 'Players',
        formatter: (cell: MatchPlayer[], row: any, rowIndex: number, formatExtraData: any) => <MatchPlayersView
          players={cell}
        />,
      },
      {
        dataField: 'draws',
        text: 'Draws',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '10%', textAlign: 'center'};
        },
      },
    ];
    return <BootstrapTable
      remote
      keyField='id'
      data={this.props.results}
      columns={columns}
      bootstrap4
      condensed
    />

  }
}
