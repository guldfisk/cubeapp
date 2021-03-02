import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';

import {CardboardCubeableRating, Cubeable, RatingMap} from '../../models/models';
import {ImageableListItem, PrintingsTooltip, TrapTooltip} from "../../utils/listitems";
import ReactTooltip from "react-tooltip";


interface RatingMapViewProps {
  ratingMap: RatingMap
}


export default class RatingMapView extends React.Component<RatingMapViewProps> {


  render() {
    const columns = [
      {
        dataField: 'cardboardCubeableId',
        text: 'Key',
        hidden: true,
      },
      {
        dataField: 'exampleCubeable',
        text: 'Cubeable',
        formatter: (cell: Cubeable, row: CardboardCubeableRating, rowIndex: number, formatExtraData: any) =>
          <ImageableListItem
            cubeable={cell}
          />,
        filterValue: (cell: Cubeable, row: CardboardCubeableRating) => cell.representation(),
      },
      {
        dataField: 'rating',
        text: 'Rating',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '6em', textAlign: 'center'};
        },
      },
    ];

    const {SearchBar} = Search;

    return <div>
      <PrintingsTooltip/>
      <TrapTooltip/>
      <ToolkitProvider
        keyField='key'
        data={this.props.ratingMap.ratings}
        columns={columns}
        bootstrap4
        search
      >
        {
          (props: any) => (
            <div>
              <SearchBar
                {...props.searchProps}
              />
              <BootstrapTable
                {...props.baseProps}
                condensed
                striped
                pagination={
                  paginationFactory(
                    {
                      hidePageListOnlyOnePage: true,
                      showTotal: true,
                      sizePerPage: 50,
                      onPageChange: () => {
                        // TODO Jesus react tool tip is so fucking bad, switch to something else.
                        (new Promise(resolve => setTimeout(resolve, 1000))).then(
                          ReactTooltip.rebuild
                        );
                      },
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
