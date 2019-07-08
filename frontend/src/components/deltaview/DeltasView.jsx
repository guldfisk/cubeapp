import React from 'react';

import Table from "react-bootstrap/Table";
import {Link} from "react-router-dom";


class DeltasView extends React.Component {

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
              <td>
                 <Link to={"/delta/" + delta.id()}>
                   {delta.author().username()}
                 </Link>
              </td>
              <td>{delta.createdAt()}</td>
            </tr>
          }
        )
      }
      </tbody>
    </Table>

  }

}

export default DeltasView;