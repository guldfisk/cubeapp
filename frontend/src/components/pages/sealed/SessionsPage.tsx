import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, {textFilter, numberFilter, selectFilter, Comparator} from 'react-bootstrap-table2-filter';

import {SealedSession, User} from '../../models/models';

import Col from "react-bootstrap/Col";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";

import {Link} from "react-router-dom";
import {DateListItem} from "../../utils/listitems";


interface SessionsPageState {
  page: number
  pageSize: number
  sessions: SealedSession[]
  hits: number
  filters: { [key: string]: string }
  sortField: string
  sortAscending: boolean
}


export default class SessionsPage extends React.Component<null, SessionsPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 20,
      sessions: [],
      hits: 0,
      filters: {},
      sortField: 'created_at',
      sortAscending: false,
    };
  }

  componentDidMount() {
    this.fetchSessions();
  }

  fetchSessions = () => {
    SealedSession.all(
      (this.state.page - 1) * this.state.pageSize,
      this.state.pageSize,
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
      console.log(filters);
      const _filters: { [key: string]: string } = {};
      for (const value of ['name', 'release', 'players', 'format', 'state']) {
        if (filters[value]) {
          _filters[value + '_filter'] = filters[value].filterVal;
        }
      }
      if (filters.poolSize) {
        _filters.pool_size_filter = filters.poolSize.filterVal.number;
        _filters.pool_size_filter_comparator = filters.poolSize.filterVal.comparator;
      }
      SealedSession.all(
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
      SealedSession.all(
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
        format: 'format',
        state: 'state',
        createdAt: 'created_at',
        playingAt: 'playing_at',
        finishedAt: 'finished_at',
      };
      const mappedSortField = sortFieldMap[sortField];
      const sortAscending = sortOrder == 'asc';
      SealedSession.all(
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

  render() {

    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'name',
        text: 'Name',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5em', textAlign: 'center'};
        },
        sort: true,
        filter: textFilter(),
      },
      {
        dataField: 'format',
        text: 'Format',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
        sort: true,
        filter: selectFilter(
          {
            options: {
              sealed: 'sealed',
            },
          }
        ),
      },
      {
        dataField: 'state',
        text: 'State',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
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
        dataField: 'release',
        text: 'Release',
        editable: false,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/release/' + cell.id}
        >
          {cell.name}
        </Link>,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
        sort: true,
        filter: textFilter(),
      },
      {
        dataField: 'players',
        text: 'Players',
        editable: false,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell.map(
          (player: User) => player.username
        ).join(', '),
        headerStyle: (column: any, colIndex: number) => {
          return {width: '7em', textAlign: 'center'};
        },
        filter: textFilter(),
      },
      {
        dataField: 'poolSize',
        text: 'Pool Size',
        editable: false,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
        sort: true,
        filter: numberFilter(
          {
            placeholder: '',
            withoutEmptyComparatorOption: true,
            comparators: [Comparator.EQ, Comparator.GT, Comparator.LT, Comparator.GE, Comparator.LE],
            style: {display: 'inline-grid'},
            defaultValue: {number: null, comparator: Comparator.GTE},
            comparatorStyle: {width: '3em', padding: '0em', float: 'left'},
            numberStyle: {width: '3em', padding: '0em', float: 'right'},

          }
        ),
      },
      {
        dataField: 'createdAt',
        text: 'Created',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
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
          return {width: '3em', textAlign: 'center'};
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
          return {width: '3em', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell && <DateListItem
          date={cell}
        />,
        sort: true,
      },
      {
        dataField: 'view',
        text: '',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '2em', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/sealed/' + row.id + '/'}
        >
          view
        </Link>,
        sort: false,
      },
    ];

    return <Container fluid>
      <Row>
        <Col sm={2}>
          <Card>
            <Card.Header>
              Actions
            </Card.Header>
            <Card.Body>
            </Card.Body>
          </Card>
        </Col>
        <Col>
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
          />
        </Col>
      </Row>
    </Container>
  }

}
