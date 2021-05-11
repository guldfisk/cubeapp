import React from 'react';

import {Link} from "react-router-dom";

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';

import {Cardboard, Cubeable, NodeRatingComponent, Printing, PrintingNode, RatingMap} from '../../models/models';


interface RatingMapComponentsViewProps {
  ratingMap: RatingMap
}


export default class RatingMapComponentsView extends React.Component<RatingMapComponentsViewProps> {

  render() {
    const columns = [
      {
        dataField: 'nodeId',
        text: 'Key',
        hidden: true,
      },
      {
        dataField: 'exampleNode',
        text: 'Node',
        formatter: (cell: PrintingNode | Printing, row: NodeRatingComponent) =>
          <Link
            to={
              '/release/'
              + this.props.ratingMap.release.id
              + '/node-details/'
              + (row.node instanceof Cardboard ? row.node.name : row.node.id)
            }
          >
            {
              cell instanceof Printing ? cell.name : cell.representation()
            }
          </Link>,
        filterValue: (cell: Cubeable) => (
          cell instanceof Printing
            ? cell.name
            : cell.representation()
        ),
      },
      {
        dataField: 'ratingComponent',
        text: 'Rating Component',
        headerStyle: () => {
          return {width: '6em', textAlign: 'center'};
        },
      },
      {
        dataField: 'weight',
        text: 'Weight',
        headerStyle: () => {
          return {width: '6em', textAlign: 'center'};
        },
      },
    ];

    const {SearchBar} = Search;

    return <div>
      <ToolkitProvider
        keyField='key'
        data={this.props.ratingMap.nodeRatingComponents}
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
