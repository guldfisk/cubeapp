import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {CardboardWish} from '../../models/models';

import '../../../styling/WishView.css';


interface RequirementsViewProps {
  cardboardWish: CardboardWish;
}


interface RequirementsViewState {
  collapsed: boolean;
}

export default class RequirementsView extends React.Component<RequirementsViewProps, RequirementsViewState> {

  constructor(props: RequirementsViewProps) {
    super(props);
    this.state = {
      collapsed: true,
    }
  }

  render() {

    if (this.state.collapsed) {
      return <i
        className="fa fa-expand"
        onClick={() => this.setState({collapsed: false})}
      />
    }

    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'type',
        text: 'Type',
      },
      {
        dataField: 'value',
        text: 'Value',
      },
    ];

    const data = this.props.cardboardWish.requirements.map(
      requirement => {
        return {
          id: requirement.id,
          type: requirement.name(),
          value: requirement.value(),
        }
      }
    );


    return <>
      <i
        className="fa fa-times-circle"
        onClick={() => this.setState({collapsed: true})}/>
      <BootstrapTable
        keyField='id'
        data={data}
        columns={columns}
        bootstrap4
        condensed
        classes="hide-header dark-table"
      />
    </>


  }

}
