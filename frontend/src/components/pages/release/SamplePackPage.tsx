import React from 'react';

import queryString from "query-string";
import {Redirect} from "react-router-dom";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container"
import Button from "react-bootstrap/Button";

import {CubeablesContainer, CubeRelease} from '../../models/models';
import CubeablesCollectionSpoilerView from "../../views/cubeablescollectionview/CubeablesCollectionSpoilerView";
import {Loading, randomString} from "../../utils/utils";
import history from '../../routing/history';


interface SamplePackPageProps {
  match: any
  location: any
}

interface SamplePackPageState {
  pack: CubeablesContainer | null
  seed: string | null
  packSize: number
}

class SamplePackPage extends React.Component<SamplePackPageProps, SamplePackPageState> {

  constructor(props: SamplePackPageProps) {
    super(props);
    this.state = {
      pack: null,
      seed: null,
      packSize: 12,
    };
  }

  getSamplePack = (): void => {
    CubeRelease.samplePack(
      this.props.match.params.id,
      this.state.packSize,
      this.state.seed,
    ).then(
      ({pack, seed}) => {
        this.setState({pack, seed})
      }
    );
  };

  getNewPath = (): string => {
    return '/release/'
      + this.props.match.params.id
      + '/sample-pack/?pack_size='
      + (this.state.packSize || 12)
      + '&seed='
      + randomString(16)
  };

  componentDidMount() {
    const _map: { [key: string]: any } = {
      seed: '',
      pack_size: 12,
    };

    for (const [key, value] of Object.entries(queryString.parse(this.props.location.search))) {
      if (key in _map) {
        let _value: any = decodeURIComponent(value instanceof Array ? value[0] : value);
        if (_value === 'pack_size') {
          _value = parseInt(_value) || 12
        }
        _map[key] = _value;
      }
    }
    this.setState(
      {seed: _map.seed, packSize: _map.pack_size},
      () => {
        if (_map.seed) {
          this.getSamplePack()
        }
      }
    )
  }

  render() {
    if (this.state.seed === '') {
      return <Redirect
        to={this.getNewPath()}
      />
    }
    let element = <Loading/>;
    if (this.state.pack !== null) {
      element = <CubeablesCollectionSpoilerView
        cubeablesContainer={this.state.pack}
        cubeableType="Cubeables"
        sizeSlug='medium'
        imageStyle={
          {
            width: '12%',
            height: 'auto',
          }
        }
      />
    }

    return <Container
      fluid
    >
      <Row>
        <Button
          onClick={
            () => {
              history.push(this.getNewPath())
            }
          }
        >
          New pack
        </Button>
        <input
          type='number'
          value={this.state.packSize.toString()}
          min={1}
          onChange={event => this.setState({packSize: parseInt(event.target.value)})}
        />
      </Row>
      <Row>
        <Col>
          {element}
        </Col>
      </Row>
    </Container>
  }

}

export default SamplePackPage;