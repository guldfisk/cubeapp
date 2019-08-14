import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import Button from "react-bootstrap/Button";


interface TestPageState {
  canEdit: boolean
}

export default class TestPage extends React.Component<null, TestPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      canEdit: true,
    }
  }

  render() {
    const columns = [
      {
        dataField: 'first',
        text: 'First',
      },
      {
        dataField: 'second',
        text: 'Second',
      }
    ];
    const data = [
      {
        first: 1,
        second: 2
      },
      {
        first: 2,
        second: 10
      },
      {
        first: 3,
        second: -12
      },
    ];

    return <div>
      <Button
        onClick={() => this.setState({canEdit: !this.state.canEdit})}
      >
        {this.state.canEdit ? "Disable editing" : "Enable Editing"}
      </Button>
      <BootstrapTable
      keyField='first'
      data={data}
      columns={columns}
      bootstrap4={true}
      cellEdit={
        !this.state.canEdit ? undefined : cellEditFactory(
          {
            mode: 'click',
            beforeSaveCell: (
              (oldValue: any, newValue: any, row: any, column: any) => {
                console.log(oldValue, newValue, row, column)
              }
            ),
            blurToSave: true,
          }
        )
      }
    />
    </div>
  }
}