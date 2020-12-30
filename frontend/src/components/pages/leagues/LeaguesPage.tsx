import React from 'react';

import Container from "react-bootstrap/Container";
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import {Link} from "react-router-dom";


import {League} from '../../models/models';
import {DateListItem} from "../../utils/listitems";


interface LeaguesPageProps {
}

interface LeaguesPageState {
  offset: number
  leagues: League[]
  hits: number
  page: number
  pageSize: number
}


export default class LeaguesPage extends React.Component<LeaguesPageProps, LeaguesPageState> {

  constructor(props: LeaguesPageProps) {
    super(props);
    this.state = {
      offset: 0,
      leagues: [],
      hits: 0,
      page: 1,
      pageSize: 10,
    };
  }

  componentDidMount() {
    this.fetchTournaments();
  }

  fetchTournaments = () => {
    League.all(
      (this.state.page - 1) * this.state.pageSize,
      this.state.pageSize,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            leagues: objects,
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
        this.fetchTournaments,
      )
    } else if (type == 'sort') {
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
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/leagues/' + row.id + '/'}
        >
          {cell}
        </Link>,
      },
      {
        dataField: 'cube',
        text: 'Cube',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/cube/' + cell.id + '/'}
        >
          {cell.name}
        </Link>,
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
          data={this.state.leagues}
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
