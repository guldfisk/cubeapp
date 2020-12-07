import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {BoosterSpecification, PoolSpecification} from "../../models/models";


interface PoolSpecificationViewProps {
  specification: PoolSpecification
}


export default class PoolSpecificationView extends React.Component<PoolSpecificationViewProps> {

  render() {
    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },

      {
        text: 'Type',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '15%', textAlign: 'center'};
        },
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => row.name(),
        isDummyField: true,
      },
      {
        dataField: 'amount',
        text: 'Amount',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '10%', textAlign: 'center'};
        },
      },
      {
        text: 'Values',
        formatter: (cell: any, row: BoosterSpecification, rowIndex: number, formatExtraData: any) => {
          const values = row.values();
          return <BootstrapTable
            keyField='id'
            data={[Object.fromEntries(values)]}
            columns={
              values.map(
                ([name, value]) => {
                  return {
                    dataField: name,
                    text: name,
                    hidden: name === 'id',
                  }
                }
              )
            }
            bootstrap4
            condensed
            classes="show-header"
          />
        },
        isDummyField: true,
      },
    ];

    return <BootstrapTable
      keyField='id'
      data={this.props.specification.boosterSpecifications}
      columns={columns}
      bootstrap4
      condensed
      classes="hide-header dark-table"
    />
  }
}
