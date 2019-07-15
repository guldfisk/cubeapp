import React from 'react';

import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form";

import {Link} from "react-router-dom";

import CubeablesCollectionListView from '../cubeablescollectionview/CubeablesCollectionListView';
import CubeablesCollectionSpoilerView from '../cubeablescollectionview/CubeablesCollectionSpoilerView';
import {CubeRelease, RawCube} from "../../models/models";


interface ReleaseMultiViewProps {
  release: CubeRelease
}

interface ReleaseMultiViewState {
  viewType: string
  cubeableType: string
  rawCube: RawCube
}

class ReleaseMultiView extends React.Component<ReleaseMultiViewProps, ReleaseMultiViewState> {

  constructor(props: ReleaseMultiViewProps) {
    super(props);
    this.state = {
      viewType: 'List',
      cubeableType: 'Cubeables',
      rawCube: props.release.rawCube(),
    }
  }

  handleFilterSubmit = (event: any) => {
    const query = event.target.elements.query.value;
    if (query === "") {
      this.setState({rawCube: this.props.release.rawCube()});
    } else {
      this.props.release.filter(
        encodeURIComponent(query)
      ).then(
        rawCube => this.setState({rawCube})
      );
    }
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    let view = <div/>;

    if (this.state.viewType === 'List') {
      view = <CubeablesCollectionListView
        rawCube={this.state.rawCube}
        cubeableType={this.state.cubeableType}
      />
    } else {
      view = <CubeablesCollectionSpoilerView
        rawCube={this.state.rawCube}
        cubeableType={this.state.cubeableType}
      />
    }
    return <Card>
      <Card.Header className="panel-heading">
        <Row>
          <h4>
            <span className="badge badge-secondary">
              <Link to={'/cube/' + this.props.release.cube().id()}>
                {this.props.release.cube().name()}
              </Link>
            </span>
            <span className="badge badge-secondary">{this.props.release.name()}</span>
            <span className="badge badge-secondary">{this.props.release.createdAt()}</span>
            <span className="badge badge-secondary">
              {this.props.release.rawCube().cubeables().length + '/' + this.props.release.intendedSize()}
            </span>
          </h4>

          <Form
            onSubmit={this.handleFilterSubmit}
          >
            <Form.Group
              controlId="query"
            >
              <Form.Control type="text"/>
            </Form.Group>
          </Form>

          <select
            className="ml-auto"
            onChange={
              event => this.setState({cubeableType: event.target.value})
            }
          >
            <option>Cubeables</option>
            <option>Printings</option>
          </select>

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
