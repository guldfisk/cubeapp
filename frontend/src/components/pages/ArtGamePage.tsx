import React from 'react';

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container"

import {getEditDistance, Loading} from '../utils/utils';
import {Printing} from '../models/models';
import {BackImage, ImageableImage} from "../images";
import Form from "react-bootstrap/Form";


interface HiddenViewProps {
  printing: Printing | null;
  handleSubmit: (name: string) => void;
  name: string
  onNameChange: (name: string) => void;
}


class HiddenView extends React.Component<HiddenViewProps, null> {

  handleSubmit = (event: any) => {
    this.props.handleSubmit(event.target.elements.name.value);
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <>
      <Row>
        {
          this.props.printing ? <ImageableImage
            imageable={this.props.printing}
            cropped={true}
            sizeSlug='original'
            allowStatic={false}
            hover={false}
          /> : <BackImage
            cropped={true}
            sizeSlug='original'
          />
        }
      </Row>
      <Row>
        <Form
          onSubmit={this.handleSubmit}
        >
          <Form.Group controlId="name">
            <Form.Control
              type="text"
              value={this.props.name}
              onChange={(event: any) => this.props.onNameChange(event.target.value)}
            />
          </Form.Group>
        </Form>
      </Row>
    </>
  }
}


interface ResultViewProps {
  printing: Printing;
  guessedName: string;
}

class ResultView extends React.Component<ResultViewProps, null> {

  render() {
    const correct = (
      getEditDistance(this.props.printing.name.toLowerCase(), this.props.guessedName.toLowerCase())
      <= Math.ceil(this.props.printing.name.length / 8)
    );
    return <>
      <Row><h3>{correct ? 'Das right' : '😠 Git gud 😠'}</h3></Row>
      <Row>
        {'You guessed: ' + this.props.guessedName + (correct ? '' : '. Correct is: ' + this.props.printing.name)}
      </Row>
      <Row>
        <ImageableImage
          imageable={this.props.printing}
          sizeSlug='original'
          allowStatic={false}
        />
      </Row>
    </>
  }
}


interface ArtGamePageState {
  printing: Printing | null;
  previousPrinting: Printing | null;
  guessedName: string;
  name: string;
}

export default class ArtGamePage extends React.Component<null, ArtGamePageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      printing: null,
      previousPrinting: null,
      guessedName: '',
      name: '',
    };
  }

  getPrinting = (guessedName: string | null = null): void => {
    if (this.state.printing) {
      this.setState(
        {
          previousPrinting: this.state.printing,
          guessedName: guessedName,
          name: '',
        }
      )
    }

    this.setState(
      {printing: null},
      () => Printing.random().then(
        printing => this.setState({printing})
      )
    );
  };

  componentDidMount() {
    this.getPrinting()
  }

  render() {
    return <Container
      fluid
    >
      <Row>
        <Col>
          <HiddenView
            printing={this.state.printing}
            handleSubmit={this.getPrinting}
            name={this.state.name}
            onNameChange={name => this.setState({name})}
          />
        </Col>
        <Col>
          {
            this.state.previousPrinting === null ?
              undefined :
              <ResultView
                printing={this.state.previousPrinting}
                guessedName={this.state.guessedName}
              />
          }
        </Col>
      </Row>
    </Container>
  }

}
