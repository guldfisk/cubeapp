import React from 'react';
import ReactDOM from 'react-dom';

import {get_cubes, get_cube} from './utils.jsx';
import CubeSpoilerView from './cubespoilerview.jsx';
import CubeListView from './cubelistview.jsx';
import CubeModel from './cubemodel.js'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';

import Bootstrap from 'bootstrap/dist/css/bootstrap.min.css';


class CubeView extends React.Component {

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
            onChange={event => this.setState({viewType: event.target.value})}
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


class CubesView extends React.Component {

  render() {

  }
}


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  componentDidMount() {
    get_cube(this.props.cubeId).then(
      response => {
        this.setState(
          {
            cube: new CubeModel(response.data),
          }
        )
      }
    )
  }

  render() {

    return <CubeView
      cube={this.state.cube}
    />
  }

}

const dom = document.getElementById("app");
dom ? ReactDOM.render(<App cubeId={dom.dataset["key"]}/>, dom) : null;
