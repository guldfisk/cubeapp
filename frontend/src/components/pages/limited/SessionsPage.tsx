import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, {textFilter, selectFilter} from 'react-bootstrap-table2-filter';

import {LimitedSession, User} from '../../models/models';

import Container from "react-bootstrap/Container";

import {Link} from "react-router-dom";
import {DateListItem} from "../../utils/listitems";
import PoolSpecificationView from "../../views/limited/PoolSpecificationView";
import {connect} from "react-redux";
import {ConfirmationDialog} from "../../utils/dialogs";


interface SessionsPageProps {
  authenticated: boolean
}

interface SessionsPageState {
  page: number
  pageSize: number
  sessions: LimitedSession[]
  hits: number
  filters: { [key: string]: string }
  sortField: string
  sortAscending: boolean
  deleting: LimitedSession | null
}


class SessionsPage extends React.Component<SessionsPageProps, SessionsPageState> {

  constructor(props: SessionsPageProps) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 20,
      sessions: [],
      hits: 0,
      filters: {},
      sortField: 'created_at',
      sortAscending: false,
      deleting: null,
    };
  }

  componentDidMount() {
    this.fetchSessions();
  }

  fetchSessions = () => {
    LimitedSession.all(
      (this.state.page - 1) * this.state.pageSize,
      this.state.pageSize,
      this.state.sortField,
      this.state.sortAscending,
      this.state.filters,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            sessions: objects,
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
        gameType: 'game_type',
        players: 'players',
        format: 'format',
        state: 'state',
      };
      for (const [key, value] of Object.entries(filterMap)) {
        if (filters[key]) {
          _filters[value + '_filter'] = filters[key].filterVal;
        }
      }
      LimitedSession.all(
        0,
        this.state.pageSize,
        this.state.sortField,
        this.state.sortAscending,
        _filters,
      ).then(
        paginatedResponse => this.setState(
          {
            filters: _filters,
            sessions: paginatedResponse.objects,
            hits: paginatedResponse.hits,
            page: 1,
          }
        )
      )
    } else if (type == 'pagination') {
      LimitedSession.all(
        (page - 1) * sizePerPage,
        sizePerPage,
      ).then(
        paginatedResponse => this.setState(
          {
            page,
            pageSize: sizePerPage,
            sessions: paginatedResponse.objects,
            hits: paginatedResponse.hits,
          }
        )
      )
    } else if (type == 'sort') {
      const sortFieldMap: { [key: string]: string } = {
        name: 'name',
        gameType: 'game_type',
        format: 'format',
        state: 'state',
        createdAt: 'created_at',
        playingAt: 'playing_at',
        finishedAt: 'finished_at',
      };
      const mappedSortField = sortFieldMap[sortField];
      const sortAscending = sortOrder == 'asc';
      LimitedSession.all(
        (this.state.page - 1) * this.state.pageSize,
        this.state.pageSize,
        mappedSortField,
        sortAscending,
        this.state.filters,
      ).then(
        paginatedResponse => this.setState(
          {
            sortField: mappedSortField,
            sortAscending,
            sessions: paginatedResponse.objects,
            hits: paginatedResponse.hits,
          }
        )
      )
    } else if (type == 'cellEdit') {
    }
  };

  deleteSession = (): void => {
    if (!this.state.deleting) {
      return
    }
    this.state.deleting.delete().then(
      () => this.setState({deleting: null}, this.fetchSessions)
    )
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
          to={'/limited/' + row.id + '/'}
        >
          {cell}
        </Link>,
        sort: true,
        filter: textFilter(),
      },
      {
        dataField: 'gameType',
        text: 'Game Type',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '7%', textAlign: 'center'};
        },
        sort: true,
        filter: selectFilter(
          {
            options: {
              draft: 'draft',
              sealed: 'sealed',
            },
          }
        ),
      },
      {
        dataField: 'format',
        text: 'Format',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '8%', textAlign: 'center'};
        },
        sort: true,
        filter: selectFilter(
          {
            options: {
              limited_sideboard: 'limited_sideboard',
              limited_15_sideboard: 'limited_15_sideboard',
            },
          }
        ),
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
              DECK_BUILDING: 'DECK_BUILDING',
              PLAYING: 'PLAYING',
              FINISHED: 'FINISHED',
            },
          }
        ),
      },
      {
        dataField: 'players',
        text: 'Players',
        editable: false,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell.map(
          (player: User) => player.username
        ).join(', '),
        headerStyle: (column: any, colIndex: number) => {
          return {width: '10%', textAlign: 'center'};
        },
        filter: textFilter(),
      },
      {
        dataField: 'poolSpecification',
        text: 'Pool Specification',
        editable: false,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <PoolSpecificationView
          specification={cell}
        />,
        headerStyle: (column: any, colIndex: number) => {
          return {textAlign: 'center'};
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
        dataField: 'playingAt',
        text: 'Playing',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5%', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell && <DateListItem
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

    if (this.props.authenticated) {
      columns.push(
        {
          text: '',
          isDummyField: true,
          editable: false,
          formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <i
            className="fa fa-times-circle"
            onClick={() => this.setState({deleting: row})}
          />,
          headerStyle: (column: any, colIndex: number) => {
            return {width: '4%', textAlign: 'center'};
          },
        }
      )
    }

    return <>
      <ConfirmationDialog
        show={!!this.state.deleting}
        callback={this.deleteSession}
        cancel={() => this.setState({deleting: null})}
      />
      <Container fluid>
        <BootstrapTable
          remote
          keyField='id'
          data={this.state.sessions}
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

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
  };
};


const mapDispatchToProps = (dispatch: any) => {
  return {};
};


export default connect(mapStateToProps, mapDispatchToProps)(SessionsPage);
