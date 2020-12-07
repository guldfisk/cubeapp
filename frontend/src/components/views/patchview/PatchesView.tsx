import React from 'react';

import Table from "react-bootstrap/Table";
import {Link} from "react-router-dom";
import {ReleasePatch} from "../../models/models";


interface DeltasViewProps {
  patches: ReleasePatch[]
}

class PatchesView extends React.Component<DeltasViewProps> {

  render() {
    return <Table>
      <thead>
      <tr>
        <th>Name</th>
        <th>Description</th>
        <th>Author</th>
        <th>Created At</th>
      </tr>
      </thead>
      <tbody>
      {
        this.props.patches.map(
          patch => {
            return <tr>
              <td>
                <Link to={"/patch/" + patch.id}>
                  {patch.name}
                </Link>
              </td>
              <td>{patch.description}</td>
              <td>
                {patch.author.username}
              </td>
              <td>{patch.createdAt}</td>
            </tr>
          }
        )
      }
      </tbody>
    </Table>

  }

}

export default PatchesView;