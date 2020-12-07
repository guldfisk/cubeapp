import React from 'react';

import {DistributionPossibility} from "../../models/models";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";


interface DistributionPossibilitiesViewProps {
  possibilities: DistributionPossibility[]
  onPossibilityClick?: (possibility: DistributionPossibility) => void
  selected?: null | string
}


export default class DistributionPossibilitiesView extends React.Component<DistributionPossibilitiesViewProps> {

  render() {
    const columns = [
      {
        dataField: 'id',
        hidden: true,
      },
      {
        dataField: 'createdAt',
        text: 'Created At',
      },
      {
        dataField: 'fitness',
        text: 'Fitness',
        type: 'number',
      },
      {
        dataField: 'pdfUrl',
        text: 'Has Pdf',
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => cell ? 'yes' : 'no',
      },
    ];

    return <BootstrapTable
      keyField='id'
      data={this.props.possibilities}
      columns={columns}
      condensed
      striped
      pagination={
        paginationFactory(
          {
            hidePageListOnlyOnePage: true,
            showTotal: true,
            sizePerPage: 10,
          }
        )
      }
      selectRow={
        {
          mode: 'radio',
          onSelect: (row: any, isSelect: any, rowIndex: number, e: any) => {
            console.log(row, isSelect, rowIndex);
            if (isSelect) {
              this.props.onPossibilityClick(row)
            }
          },
          hideSelectAll: true,
          selected: this.props.selected ? [this.props.selected] : null,
        }
      }
    />;

  }

}