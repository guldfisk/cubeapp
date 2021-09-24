import Container from "react-bootstrap/Container";
import React from 'react';
import {connect} from "react-redux";
import {Link} from "react-router-dom";

import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, {textFilter, selectFilter} from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';

import PoolSpecificationView from "../../views/limited/PoolSpecificationView";
import {DateListItem} from "../../utils/listitems";
import {DraftSeat, DraftSession, LimitedSession, LimitedSessionName} from '../../models/models';


interface DraftsPageProps {
  authenticated: boolean
}

interface DraftsPageState {
  page: number
  pageSize: number
  drafts: DraftSession[]
  hits: number
  filters: { [key: string]: string }
  sortField: string
  sortAscending: boolean
  deleting: LimitedSession | null
}


class DraftsPage extends React.Component<DraftsPageProps, DraftsPageState> {

  constructor(props: DraftsPageProps) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 20,
      drafts: [],
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
    DraftSession.all(
      (this.state.page - 1) * this.state.pageSize,
      this.state.pageSize,
      this.state.sortField,
      this.state.sortAscending,
      this.state.filters,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            drafts: objects,
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
        draftFormat: 'draft_format',
        seats: 'seats',
        state: 'state',
      };
      for (const [key, value] of Object.entries(filterMap)) {
        if (filters[key]) {
          _filters[value + '_filter'] = filters[key].filterVal;
        }
      }
      DraftSession.all(
        0,
        this.state.pageSize,
        this.state.sortField,
        this.state.sortAscending,
        _filters,
      ).then(
        paginatedResponse => this.setState(
          {
            filters: _filters,
            drafts: paginatedResponse.objects,
            hits: paginatedResponse.hits,
            page: 1,
          }
        )
      )
    } else if (type == 'pagination') {
      DraftSession.all(
        (page - 1) * sizePerPage,
        sizePerPage,
      ).then(
        paginatedResponse => this.setState(
          {
            page,
            pageSize: sizePerPage,
            drafts: paginatedResponse.objects,
            hits: paginatedResponse.hits,
          }
        )
      )
    } else if (type == 'sort') {
      const sortFieldMap: { [key: string]: string } = {
        name: 'key',
        draftFormat: 'draft_format',
        state: 'state',
        startedAt: 'started_at',
        finishedAt: 'finishedAt',
      };
      const mappedSortField = sortFieldMap[sortField];
      const sortAscending = sortOrder == 'asc';
      DraftSession.all(
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
            drafts: paginatedResponse.objects,
            hits: paginatedResponse.hits,
          }
        )
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
          to={'/drafts/' + row.id + '/'}
        >
          {cell}
        </Link>,
        sort: true,
      },
      {
        dataField: 'limitedSession',
        text: 'Limited Session',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '10%', textAlign: 'center'};
        },
        formatter: (cell: LimitedSessionName | null, row: any, rowIndex: number, formatExtraData: any) => cell && <Link
          to={'/limited/' + cell.id + '/'}
        >
          {cell.name}
        </Link>,
        sort: false,
      },
      {
        dataField: 'draftFormat',
        text: 'Draft Format',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '8%', textAlign: 'center'};
        },
        sort: true,
        filter: selectFilter(
          {
            options: {
              single_pick: 'single_pick',
              burn: 'burn',
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
              DRAFTING: 'DRAFTING',
              COMPLETED: 'COMPLETED',
              ABANDONED: 'ABANDONED',
            },
          }
        ),
      },
      {
        dataField: 'seats',
        text: 'Seats',
        editable: false,
        formatter: (cell: DraftSeat[], row: any, rowIndex: number, formatExtraData: any) => cell.map(
          seat => seat.user.username
        ).join(', '),
        headerStyle: (column: any, colIndex: number) => {
          return {width: '6%', textAlign: 'center'};
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
        dataField: 'startedAt',
        text: 'Started',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5%', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <DateListItem
          date={cell}
        />,
        sort: true,
      },
      {
        dataField: 'endedAt',
        text: 'Ended',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5%', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell && <DateListItem
          date={cell}
        />,
        sort: true,
      },
    ];

    return <Container fluid>
      <BootstrapTable
        remote
        keyField='id'
        data={this.state.drafts}
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


export default connect(mapStateToProps, mapDispatchToProps)(DraftsPage);
