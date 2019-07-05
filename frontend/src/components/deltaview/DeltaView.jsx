import React from 'react';

import {Link} from "react-router-dom";

import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";


class DeltaView extends React.Component {

  render() {

    return <Table>
      <thead>
      <tr>
        <th>Name</th>
        <th>Created At</th>
        <th>Intended Size</th>
      </tr>
      </thead>
      <tbody>
      {
        this.props.cube.releases().map(
          release => {
            return <tr>
              <td>
                <Link to={"/release/" + release.id()}>
                  {release.name()}
                </Link>
              </td>
              <td>{release.createdAt()}</td>
              <td>{release.intendedSize()}</td>
            </tr>
          }
        )
      }
      </tbody>
    </Table>

  }

}

export default DeltaView;