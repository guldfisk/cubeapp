import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"

import {Link} from "react-router-dom";

import ReleaseListView from "./ReleaseListView.jsx";
import ReleaseSpoilerView from "./ReleaseSpoilerView.jsx";


class ReleaseMultiView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      viewType: 'List',
    }

  }

  render() {
    let view = <div/>;

    if (this.state.viewType === 'List') {
      view = <ReleaseListView
        cube={this.props.cube}
      />
    } else {
      view = <ReleaseSpoilerView
        cube={this.props.cube}
      />
    }
    return <Card>
      <Card.Header className="panel-heading">
        <Row>
          <h4>
            <span className="badge badge-secondary">
              <Link to={'/cube/' + this.props.cube.cube().id()}>
                {this.props.cube.cube().name()}
              </Link>
            </span>
            <span className="badge badge-secondary">{this.props.cube.name()}</span>
            <span className="badge badge-secondary">{this.props.cube.createdAt()}</span>
            <span className="badge badge-secondary">
              {this.props.cube.cubeables().length + '/' + this.props.cube.intendedSize()}
            </span>
          </h4>
          <select
            className="ml-auto"
            onChange={
              event => this.setState({viewType: event.target.value})
            }
          >
            <option>List</option>
            <option>Images</option>
          </select>
        </Row>
      </Card.Header>
      <Card.Body className="panel-body">
        {view}
      </Card.Body>
    </Card>

  }
}


export default ReleaseMultiView;
