import React from 'react';

import Table from "react-bootstrap/Table";
import {DistributionPossibility} from "../../models/models";


interface DistributionPossibilitiesViewProps {
  possibilities: DistributionPossibility[]
  onPossibilityClick?: (possibility: DistributionPossibility) => void
}

export default class DistributionPossibilitiesView extends React.Component<DistributionPossibilitiesViewProps> {

  render() {
    return <Table>
      <thead>
      <tr>
        <th>ID</th>
        <th>Created At</th>
        <th>Fitness</th>
        <th>Has pdf</th>
      </tr>
      </thead>
      <tbody>
      {
        this.props.possibilities.map(
          possibility => {
            return <tr>
              <td>{possibility.id}</td>
              <td>
                <span
                  onClick={
                    !this.props.onPossibilityClick ? undefined :
                      () => this.props.onPossibilityClick(possibility)
                  }
                >
                  {possibility.createdAt}
                </span>
              </td>
              <td>{possibility.fitness}</td>
              <td>{possibility.pdfUrl ? 'yes' : 'no'}</td>
            </tr>
          }
        )
      }
      </tbody>
    </Table>

  }

}