import React from 'react';

import {Link} from "react-router-dom";

import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";


class CubeView extends React.Component {

  render() {

    return <Card>
      <Card.Header className="panel-heading">
        <Row>
          <h4>
            <span className="badge badge-secondary">{this.props.cube.name()}</span>
            <span className="badge badge-secondary">{this.props.cube.createdAt()}</span>
          </h4>
        </Row>
      </Card.Header>
      <Card.Body className="panel-body">
        <Table>
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
      </Card.Body>
    </Card>

  }

}

export default CubeView;