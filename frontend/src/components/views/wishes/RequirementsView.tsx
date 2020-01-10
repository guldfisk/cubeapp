import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';

import {CardboardWish, Requirement} from '../../models/models';

import '../../../styling/WishView.css';


interface RequirementsViewProps {
  cardboardWish: CardboardWish;
  onRequirementDelete?: (requirement: Requirement) => void
  onAddRequirement?: () => void
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
      {
        dataField: 'delete',
        text: 'Delete',
        isDummyField: true,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <i
          className="fa fa-times-circle"
          onClick={() => this.props.onRequirementDelete && this.props.onRequirementDelete(row.requirement)}
        />,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '2em', textAlign: 'center'};
        },
      },
    ];

    const data = this.props.cardboardWish.requirements.map(
      requirement => {
        return {
          requirement: requirement,
          id: requirement.id,
          type: requirement.name(),
          value: requirement.value(),
        }
      }
    );


    return <>
      <i
        className="fa fa-times-circle"
        onClick={() => this.setState({collapsed: true})}
      />
      <i
        className="fa fa-plus-circle"
        onClick={() => this.props.onAddRequirement && this.props.onAddRequirement()}
      />
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
