import React from 'react';

import {Link} from "react-router-dom";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

import {Loading} from '../utils/utils';
import {Patch, Printing} from '../models/models';
import PatchView from '../views/patchview/PatchView';
import SearchView from "../views/search/SearchView";
import {connect} from "react-redux";


interface DeltaPageProps {
  match: any
  token: string
}

interface DeltaPageState {
  patch: null | Patch
}

class PatchPage extends React.Component<DeltaPageProps, DeltaPageState> {

  constructor(props: DeltaPageProps) {
    super(props);
    this.state = {
      patch: null,
    };
  }

  componentDidMount() {
    Patch.get(
      this.props.match.params.id
    ).then(
      patch => {
        this.setState({patch})
      }
    );
  }

  handleAddCard = (printing: Printing) => {
    this.state.patch.update(printing, this.props.token).then(
      (patch: Patch) => {
        console.log(patch);
        this.setState({patch});
      }
    )
  };

  render() {
    let patchView = <Loading/>;
    if (this.state.patch !== null) {
      patchView = <PatchView
        patch={this.state.patch}
      />
    }

    return <Container fluid>
      <Row>
        <Col sm={2}>
          <Card>
            <Card.Header>
              Actions
            </Card.Header>
            <Card.Body>
              <p><Link to={"#"}>Something</Link></p>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <SearchView
            handleCardClicked={this.handleAddCard}
          />
        </Col>
        <Col>
          {patchView}
        </Col>
      </Row>
    </Container>
  }

}

const mapStateToProps = (state: any) => {
  return {
    token: state.token,
  };
};


export default connect(mapStateToProps, null)(PatchPage);
