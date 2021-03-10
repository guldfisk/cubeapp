import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider from 'react-bootstrap-table2-toolkit';

import {Cardboard, Infinites} from '../../models/models';
import {CardboardListItem} from "../../utils/listitems";


interface InfinitesViewProps {
  infinites: Infinites
  noHover?: boolean
  onCardboardClick?: ((cardboard: Cardboard) => void) | null
}


export default class InfinitesView extends React.Component<InfinitesViewProps, null> {

  render() {

    const columns = [
      {
        dataField: 'key',
        text: 'Key',
        hidden: true,
      },
      {
        dataField: 'name',
        text: 'Name',
        type: 'string',
        sort: true,
        sortFunc: (a: string, b: string, order: string) => {
          if (order === 'desc') {
            return a > b ? -1 : a < b ? 1 : 0;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <CardboardListItem
          cardboard={row}
          multiplicity={1}
          noHover={this.props.noHover}
          onClick={this.props.onCardboardClick}
        />,
      },
    ];

    return <div>
      <ToolkitProvider
        keyField='key'
        data={this.props.infinites.cardboards}
        columns={columns}
        bootstrap4
      >
        {
          (props: any) => (
            <div>
              <BootstrapTable
                {...props.baseProps}
                condensed
                striped
                defaultSorted={
                  [
                    {
                      dataField: 'name',
                      order: 'asc',
                    },
                  ]
                }
                pagination={
                  paginationFactory(
                    {
                      hidePageListOnlyOnePage: true,
                      showTotal: true,
                      sizePerPage: 30,
                    }
                  )
                }
              />
            </div>
          )
        }
      </ToolkitProvider>
    </div>
  }
}
