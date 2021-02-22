import React from 'react';

import Container from "react-bootstrap/Container";
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import {Link} from "react-router-dom";


import {League, ScoredDeck} from '../../models/models';
import {DateListItem} from "../../utils/listitems";


interface LeaderboardProps {
  leagueId: string
}

interface LeaderboardState {
  offset: number
  decks: ScoredDeck[]
  hits: number
  page: number
  pageSize: number
}


export default class Leaderboard extends React.Component<LeaderboardProps, LeaderboardState> {

  constructor(props: LeaderboardProps) {
    super(props);
    this.state = {
      offset: 0,
      decks: [],
      hits: 0,
      page: 1,
      pageSize: 10,
    };
  }

  componentDidMount() {
    this.fetchDecks();
  }

  fetchDecks = () => {
    League.leaderboard(
      this.props.leagueId,
      (this.state.page - 1) * this.state.pageSize,
      this.state.pageSize,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            decks: objects,
            hits,
          }
        )
      }
    );
  };

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
      this.setState(
        {
          page,
          pageSize: sizePerPage,
        },
        this.fetchDecks,
      )
    } else if (type == 'sort') {
    } else if (type == 'cellEdit') {
    }
  };

  render() {
    console.log(this.state.decks.map(deck => deck.averagePlacement));
    const columns: { [key: string]: any } = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'name',
        text: 'Name',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/pools/' + row.poolId + '/'}
        >
          {cell}
        </Link>,
      },
      {
        dataField: 'wins',
        text: 'Wins',
      },
      {
        dataField: 'seasons',
        text: 'Seasons',
      },
      {
        dataField: 'averagePlacement',
        text: 'Average Placement',
      },
      {
        dataField: 'createdAt',
        text: 'Created',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5%', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <DateListItem
          date={cell}
        />,
        sort: true,
      },
    ];

    return <>
      <Container fluid>
        <BootstrapTable
          remote
          keyField='id'
          data={this.state.decks}
          columns={columns}
          bootstrap4
          condensed
          pagination={
            paginationFactory(
              {
                hidePageListOnlyOnePage: true,
                showTotal: true,
                page: this.state.page,
                sizePerPage: this.state.pageSize,
                totalSize: this.state.hits,
              }
            )
          }
          onTableChange={this.handleTableChanged}
          classes='dark-table'
        />
      </Container>
    </>
  }

}
