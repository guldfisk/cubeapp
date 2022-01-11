import React from 'react';

import Container from "react-bootstrap/Container";
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';

import {Lobby, LobbyUser} from "../../models/lobbies";
import {User} from "../../models/models";
import {Button} from "react-bootstrap";


interface LobbiesViewProps {
  lobbies: Lobby[]
  onJoin: (lobby: Lobby) => void
  user: User
}

interface LobbiesViewState {

}


export default class LobbiesView extends React.Component<LobbiesViewProps, LobbiesViewState> {

  constructor(props: LobbiesViewProps) {
    super(props);
    this.state = {
      offset: 0,
      decks: [],
      hits: 0,
      page: 1,
      pageSize: 10,
    };
  }

  handleTableChanged = (
    type: string,
    {page, sizePerPage, filters, sortField, sortOrder, data, cellEdit}:
      {
        page: number,
        sizePerPage: number,
        filters: any,
        sortField: string,
        sortOrder: string,
        data: any,
        cellEdit: any,
      },
  ) => {
    if (type == 'filter') {
    } else if (type == 'pagination') {
    } else if (type == 'sort') {
    } else if (type == 'cellEdit') {
    }
  };

  render() {
    console.log(this.props.lobbies)

    const columns: { [key: string]: any } = [
      {
        dataField: 'name',
        text: 'Name',
      },
      {
        dataField: 'state',
        text: 'State',
      },
      {
        dataField: 'gameType',
        text: 'Game Type',
      },
      {
        dataField: 'owner',
        text: 'Owner',
      },
      {
        dataField: 'users',
        text: 'Users',
        formatter: (cell: LobbyUser[]) => cell.map((user) => user.username).join(', '),
      },
      {
        dataField: 'join',
        isDummy: true,
        text: 'Join',
        formatter: (cell: any, row: Lobby) => (
          !row.users.some((user) => user.username === this.props.user.username) ?
            <Button onClick={() => this.props.onJoin(row)}>join</Button> : null
        ),
      },
    ];

    return <BootstrapTable
      remote
      keyField='name'
      data={this.props.lobbies}
      columns={columns}
      bootstrap4
      condensed
      pagination={
        paginationFactory(
          {
            hidePageListOnlyOnePage: true,
            showTotal: true,
            sizePerPage: 10,
          }
        )
      }
      classes='dark-table'
    />
  }

}
