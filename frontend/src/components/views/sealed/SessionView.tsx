import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {FullSealedSession} from "../../models/models";


interface SessionViewProps {
  session: FullSealedSession;
}

interface SessionViewState {

}

export default class SessionView extends React.Component<SessionViewProps, null> {

  render() {

    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
    ];


    return <BootstrapTable
      keyField='id'
      data={this.props.session.pools}
      columns={columns}
      bootstrap4
      condensed
    />
  }

}