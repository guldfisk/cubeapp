import React from 'react';

import Table from "react-bootstrap/Table";


class DeltaView extends React.Component {

  render() {

    return <Table>
      <thead>
      <tr>
        <th>Description</th>
        <th>Author</th>
        <th>Created At</th>
      </tr>
      </thead>
      <tbody>
      {
        this.props.deltas.map(
          delta => {
            return <tr>
              <td>{delta.description()}</td>
              <td>{delta.author().username}</td>
              <td>{delta.createdAt()}</td>
            </tr>
          }
        )
      }
      </tbody>
    </Table>

  }

}

export default DeltaView;