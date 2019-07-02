import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card"

import CubeListView from "./CubeListView.jsx";
import CubeSpoilerView from "./CubeSpoilerView.jsx";


class CubeMultiView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      viewType: 'List',
    }

  }

  render() {
    let view = <div/>;

    if (this.state.viewType === 'List') {
      view = <CubeListView
        cube={this.props.cube}
      />
    } else {
      view = <CubeSpoilerView
        cube={this.props.cube}
      />
    }

    return <Card>
      <Card.Header className="panel-heading">
        <Row>
          <h4>
            <span className="badge badge-secondary">{this.props.cube.name()}</span>
            <span className="badge badge-secondary">{this.props.cube.created_at()}</span>
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


export default CubeMultiView;
