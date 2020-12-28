import React from 'react';

import Container from "react-bootstrap/Container";
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, {textFilter, selectFilter} from 'react-bootstrap-table2-filter';
import {Link} from "react-router-dom";


import {MatchType, Tournament, TournamentParticipant} from '../../models/models';
import {DateListItem} from "../../utils/listitems";
import ParticipantsView from "../../views/tournaments/ParticipantsView";


interface TournamentsPageProps {
  authenticated: boolean
}

interface TournamentsPageState {
  offset: number
  tournaments: Tournament[]
  hits: number
  page: number
  pageSize: number
  filters: { [key: string]: string }
  sortField: string
  sortAscending: boolean
}


export default class TournamentsPage extends React.Component<TournamentsPageProps, TournamentsPageState> {

  constructor(props: TournamentsPageProps) {
    super(props);
    this.state = {
      offset: 0,
      tournaments: [],
      hits: 0,
      page: 1,
      pageSize: 20,
      filters: {},
      sortField: 'created_at',
      sortAscending: false,
    };
  }

  componentDidMount() {
    this.fetchTournaments();
  }

  fetchTournaments = () => {
    Tournament.all(
      (this.state.page - 1) * this.state.pageSize,
      this.state.pageSize,
      this.state.sortField,
      this.state.sortAscending,
      this.state.filters,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            tournaments: objects,
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
      const _filters: { [key: string]: string } = {};
      const filterMap: { [key: string]: string } = {
        name: 'name',
        tournamentType: 'tournament_type',
        participants: 'players',
        state: 'state',
      };
      console.log(filterMap, filters);
      for (const [key, value] of Object.entries(filterMap)) {
        if (filters[key]) {
          _filters[value + '_filter'] = filters[key].filterVal;
        }
      }
      this.setState(
        {
          page: 1,
          filters: _filters,
        },
        this.fetchTournaments,
      )
    } else if (type == 'pagination') {
      this.setState(
        {
          page,
          pageSize: sizePerPage,
        },
        this.fetchTournaments,
      )
    } else if (type == 'sort') {
      const sortFieldMap: { [key: string]: string } = {
        name: 'name',
        tournamentType: 'tournament_type',
        state: 'state',
        createdAt: 'created_at',
        finishedAt: 'finished_at',
      };
      this.setState(
        {
          sortField: sortFieldMap[sortField],
          sortAscending: sortOrder == 'asc',
        },
        this.fetchTournaments,
      )
    } else if (type == 'cellEdit') {
    }
  };

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
        headerStyle: (column: any, colIndex: number) => {
          return {width: '10%', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/tournaments/' + row.id + '/'}
        >
          {cell}
        </Link>,
        sort: true,
        filter: textFilter(),
      },
      {
        dataField: 'tournamentType',
        text: 'Type',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '8%', textAlign: 'center'};
        },
        sort: true,
        filter: selectFilter(
          {
            options: {
              all_matches: 'all_matches',
              swiss: 'swiss',
              single_elimination: 'single_elimination',
            },
          }
        ),
      },
      {
        dataField: 'matchType',
        text: 'Match Type',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '4%', textAlign: 'center'};
        },
        sort: false,
        formatter: (cell: MatchType, row: any, rowIndex: number, formatExtraData: any) => cell.fullName(),
      },
      {
        dataField: 'state',
        text: 'State',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '8%', textAlign: 'center'};
        },
        sort: true,
        filter: selectFilter(
          {
            options: {
              ONGOING: 'ONGOING',
              FINISHED: 'FINISHED',
              CANCELED: 'CANCELED',
            },
          }
        ),
      },
      {
        dataField: 'participants',
        text: 'Players',
        formatter: (cell: TournamentParticipant[], row: any, rowIndex: number, formatExtraData: any) =>
          <ParticipantsView
            participants={cell}
          />,
        filter: textFilter(),
      },
      {
        dataField: 'rounds',
        text: 'Completed Rounds',
        editable: false,
        formatter: (cell: any, row: Tournament, rowIndex: number, formatExtraData: any) =>
          <span>{row.completedRounds() + '/' + row.roundAmount}</span>,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '6%', textAlign: 'center'};
        },
      },
      {
        dataField: 'rounds',
        text: 'Completed Matches For Round',
        editable: false,
        formatter: (cell: any, row: Tournament, rowIndex: number, formatExtraData: any) => {
          const lastRound = row.rounds[row.rounds.length - 1];
          return <span>
            {lastRound.matches.filter(match => match.result).length + '/' + lastRound.matches.length}
          </span>;
        },
        headerStyle: (column: any, colIndex: number) => {
          return {width: '6%', textAlign: 'center'};
        },
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
      {
        dataField: 'finishedAt',
        text: 'Finished',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5%', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell && <DateListItem
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
          data={this.state.tournaments}
          columns={columns}
          bootstrap4
          condensed
          filter={filterFactory()}
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
