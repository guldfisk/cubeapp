import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';
import {Link} from "react-router-dom";
import {MultiValue} from "react-select";

import {CardboardListItem} from '../../utils/listitems';
import {MinimalRatingMap, StatMap} from '../../models/models';
import {roundToN} from "../../utils/utils";
import {StatSelector} from "./StatSelector";


interface StatMapViewState {
  columns: MultiValue<{ value: string, label: string }>
}

interface StatMapViewProps {
  stats: StatMap
  ratingMap: MinimalRatingMap
}


export default class StatMapView extends React.Component<StatMapViewProps, StatMapViewState> {

  constructor(props: StatMapViewProps) {
    super(props);
    this.state = {
      columns: [
        {value: 'ci_win_rate', label: 'Ci Win Rate'},
        {value: 'win_rate', label: 'Win Rate'},
        {value: 'matches', label: 'Matches'},
        {value: 'deck_conversion_rate', label: 'Deck Conversion Rate'},
      ]
    };
  }

  render() {
    const columns = [
      {
        dataField: 'cardboardName',
        text: 'Cardboard',
        formatter: (cell: string) =>
          <Link
            to={'/release/' + this.props.ratingMap.release.id + '/cardboard-details/' + cell.replace('/', '_') + '/'}
          >
            <CardboardListItem
              cardboard={cell}
              multiplicity={1}
            />
          </Link>,
      },
      ...this.state.columns.map(
        (c) => {
          return {
            dataField: c.value,
            text: c.label,
            sort: true,
            formatter: (cell: number) => roundToN(cell, 4),
          }
        }
      )
    ];

    const rows = Object.entries(this.props.stats.stats).map(
      ([cardboardName, values]) => {
        return {
          cardboardName,
          ...values,
        }
      }
    )

    const {SearchBar} = Search;

    return <div>
      <StatSelector
        value={this.state.columns}
        onChange={(columns) => this.setState({columns})}
      />
      <ToolkitProvider
        keyField='cardboardName'
        data={rows}
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
                defaultSorted={
                  [
                    {
                      dataField: 'ci_win_rate',
                      order: 'desc',
                    },
                  ]
                }
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
