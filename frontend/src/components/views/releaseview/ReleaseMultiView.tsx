import React from 'react';

import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form";

import {Link} from "react-router-dom";

import CubeablesCollectionListView from '../cubeablescollectionview/CubeablesCollectionListView';
import CubeablesCollectionSpoilerView from '../cubeablescollectionview/CubeablesCollectionSpoilerView';
import {CubeRelease, CubeablesContainer} from "../../models/models";


interface ReleaseMultiViewProps {
  release: CubeRelease
}


interface ReleaseMultiViewState {
  viewType: string
  cubeableType: string
  cubeablesContainer: CubeablesContainer
}


class ReleaseMultiView extends React.Component<ReleaseMultiViewProps, ReleaseMultiViewState> {

  constructor(props: ReleaseMultiViewProps) {
    super(props);
    this.state = {
      viewType: 'List',
      cubeableType: 'Cubeables',
      cubeablesContainer: props.release.cubeablesContainer(),
    }
  }

  handleFilterSubmit = (event: any) => {
    const query = event.target.elements.query.value;
    if (query === "") {
      this.setState({cubeablesContainer: this.props.release.cubeablesContainer()});
    } else {
      this.props.release.filter(
        // encodeURIComponent(query),
        query,
        this.state.cubeableType !== 'Cubeables',
      ).then(
        rawCube => this.setState({cubeablesContainer: rawCube})
      );
    }
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    let view = <div/>;

    if (this.state.viewType === 'List') {
      view = <CubeablesCollectionListView
        rawCube={this.state.cubeablesContainer}
        cubeableType={this.state.cubeableType}
      />
    } else {
      view = <CubeablesCollectionSpoilerView
        cubeablesContainer={this.state.cubeablesContainer}
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
              {
                `${
                  Array.from(
                    this.props.release.cubeablesContainer().cubeables()
                  ).length
                  }/${
                  this.props.release.intendedSize()
                  }`
              }
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
