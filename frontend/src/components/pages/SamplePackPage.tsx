import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container"

import {Loading} from '../utils/utils';
import {CubeablesContainer, CubeRelease} from '../models/models';
import CubeablesCollectionSpoilerView from "../views/cubeablescollectionview/CubeablesCollectionSpoilerView";
import Button from "react-bootstrap/Button";


interface SamplePackPageProps {
  match: any
}

interface SamplePackPageState {
  pack: CubeablesContainer | null
  packSize: number
}

class SamplePackPage extends React.Component<SamplePackPageProps, SamplePackPageState> {

  constructor(props: SamplePackPageProps) {
    super(props);
    this.state = {
      pack: null,
      packSize: 12,
    };
  }

  getSamplePack = (): void => {
    CubeRelease.samplePack(
      this.props.match.params.id,
      this.state.packSize,
    ).then(
      pack => {
        this.setState({pack})
      }
    );
  };

  componentDidMount() {
    this.getSamplePack()
  }

  render() {
    let element = <Loading/>;
    if (this.state.pack !== null) {
      element = <CubeablesCollectionSpoilerView
        cubeablesContainer={this.state.pack}
        cubeableType="Cubeables"
        sizeSlug='medium'
      />
    }

    return <Container
      fluid
    >
      <Row>
        <Button
          onClick={() => this.getSamplePack()}
        >
          New pack
        </Button>
        <input
          type='number'
          defaultValue={this.state.packSize.toString()}
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