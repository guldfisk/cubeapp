import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';

import {EditEvent} from '../../models/models';
import VerbosePatchView from "./VerbosePatchView";
import ToolkitProvider, {Search} from 'react-bootstrap-table2-toolkit';


interface EditHistoryProps {
  history: EditEvent[]
  eventClicked?: (event: EditEvent) => void
}


export default class EditHistory extends React.Component<EditHistoryProps> {

  render() {
    const columns = [
      {
        dataField: 'key',
        text: 'Key',
        hidden: true,
      },
      {
        dataField: 'username',
        text: 'User',
        type: 'string',
      },
      {
        dataField: 'changes',
        text: 'Changes',
      },
    ];

    const data = this.props.history.map(
      event => {
        return {
          key: event.id,
          username: event.user.username,
          changes: <VerbosePatchView
            patch={event.change}
            onChangeClicked={
              !this.props.eventClicked ? undefined :
                () => {
                  this.props.eventClicked(event);
                }
            }
          />,
        }
      }
    );

    const {SearchBar} = Search;

    return <ToolkitProvider
      keyField='key'
      data={data}
      columns={columns}
      bootstrap4
      search
    >
      {
        (props: any) => (
          <>
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
                    showTotal: false,
                    sizePerPage: 5,
                  }
                )
              }
            />
          </>
        )
      }

    </ToolkitProvider>;
  }

}
