import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';

import {SealedPoolMeta} from '../../models/models';

import Col from "react-bootstrap/Col";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";

import {Link} from "react-router-dom";
import {DateListItem} from "../../utils/listitems";


interface PoolsPageState {
  page: number
  pageSize: number
  pools: SealedPoolMeta[]
  hits: number
  filters: { [key: string]: string }
  sortField: string
  sortAscending: boolean
}


export default class PoolsPage extends React.Component<null, PoolsPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 10,
      pools: [],
      hits: 0,
      filters: {},
      sortField: 'createdAt',
      sortAscending: false,
    };
  }

  componentDidMount() {
    this.fetchPools();
  }

  fetchPools = () => {
    SealedPoolMeta.all(
      (this.state.page - 1) * this.state.pageSize,
      this.state.pageSize,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            pools: objects,
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
      SealedPoolMeta.all(
        (page - 1) * sizePerPage,
        sizePerPage,
      ).then(
        paginatedResponse => this.setState(
          {
            page,
            pageSize: sizePerPage,
            pools: paginatedResponse.objects,
            hits: paginatedResponse.hits,
          }
        )
      )
    } else if (type == 'sort') {
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
        dataField: 'release',
        text: 'Release',
        editable: false,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/release/' + cell.id}
        >
          {cell.name}
        </Link>,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5em', textAlign: 'center'};
        },
      },
      {
        dataField: 'poolSize',
        text: 'Pool Size',
        editable: false,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
      },
      {
        dataField: 'createdAt',
        text: 'Created',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '7em', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <DateListItem
          date={cell}
        />,
        sort: true,
        editable: false,
      },
      {
        dataField: 'view',
        text: '',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '3em', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <Link
          to={'/pools/' + row.id + '/'}
        >
          view
        </Link>,
        sort: false,
        editable: false,
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
            data={this.state.pools}
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
          />
        </Col>
      </Row>
    </Container>
  }

}
