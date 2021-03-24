import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';
import {Link} from "react-router-dom";

import {CardboardCubeableRating, Cubeable, RatingMap} from '../../models/models';
import {ImageableListItem} from "../../utils/listitems";


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
          <Link
            to={'/release/' + this.props.ratingMap.release.id + '/cubeable-details/' + row.cardboardCubeableId + '/'}
          >
            <ImageableListItem
              cubeable={cell}
            />
          </Link>,
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
