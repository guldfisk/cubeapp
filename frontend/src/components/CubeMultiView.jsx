import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import CubeListView from "./cubelistview";
import CubeSpoilerView from "./cubespoilerview";
import Container from "react-bootstrap/Container";


class CubeMultiView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      viewType: 'List',
    }

  }

  render() {
    let view = <div/>;
    if (!(this.props.cube === null)) {
      if (this.state.viewType === 'List') {
        view = <CubeListView
          cube={this.props.cube}
        />
      } else {
        view = <CubeSpoilerView
          cube={this.props.cube}
        />
      }
    }

    return <Container
      fluid={true}
    >
      <Row>
        <Col>
          <select
            onChange={
              event => this.setState({viewType: event.target.value})
            }
          >
            <option>List</option>
            <option>Images</option>
          </select>
        </Col>
      </Row>
      <Row>
        <Col>
          {view}
        </Col>
      </Row>
    </Container>
  }

}


export default CubeMultiView;
