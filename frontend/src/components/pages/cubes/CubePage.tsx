import React from 'react';

import {Link} from "react-router-dom";

import history from '../../routing/history';
import {Loading} from '../../utils/utils';
import CubeView from '../../views/cubeview/CubeView';
import {Cube, MinimalCube} from '../../models/models';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import {ConfirmationDialog} from "../../utils/dialogs";
import {Modal} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import CreateCubeForm from "../../views/cubeview/CreateCubeForm";
import {connect} from "react-redux";


interface ForkCubeDialogProps {
  callback: ({name, description}: { name: string, description: string }) => void
  cancel: () => void
  show: boolean
  cube?: MinimalCube
  enabled: boolean
}


export const ForkCubeDialog: React.SFC<ForkCubeDialogProps> = (props: ForkCubeDialogProps) => {
  return <Modal
    show={props.show}
  >
    <Modal.Header closeButton>
      <Modal.Title>Fork cube</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <CreateCubeForm
        handleSubmit={props.callback}
        defaultDescription={props.cube ? 'Forked from ' + props.cube.name : null}
        enabled={props.enabled}
      />
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={props.cancel}>Cancel</Button>
    </Modal.Footer>
  </Modal>
};


interface CubePageProps {
  match: any
  authenticated: boolean
}


interface CubePageState {
  cube: null | Cube
  deleting: boolean
  forking: boolean
  forkPending: boolean
}


class CubePage extends React.Component<CubePageProps, CubePageState> {

  constructor(props: CubePageProps) {
    super(props);
    this.state = {
      cube: null,
      deleting: false,
      forking: false,
      forkPending: false,
    };
  }

  componentDidMount() {
    Cube.get(this.props.match.params.id).then(
      cube => {
        this.setState({cube})
      }
    );
  }

  handleDelete = (): void => {
    this.state.cube.delete().then(
      () => history.push('/')
    )
  };

  handleFork = ({name, description}: { name: string, description: string }): void => {
    this.setState(
      {forkPending: true},
      () => this.state.cube.fork(name, description).then(
        cube => history.push('/cube/' + cube.id)
      ).catch(() => this.setState({forkPending: false}))
    );
  };

  render() {
    let cube = <Loading/>;
    if (this.state.cube !== null) {
      cube = <CubeView
        cube={this.state.cube}
      />
    }

    return <>
      <ConfirmationDialog
        show={this.state.deleting && !!this.state.cube}
        callback={this.handleDelete}
        cancel={() => this.setState({deleting: null})}
      />
      <ForkCubeDialog
        callback={this.handleFork}
        cancel={() => {
          this.setState({forking: false})
        }}
        show={this.state.forking && !!this.state.cube}
        cube={this.state.cube}
        enabled={!this.state.forkPending}
      />
      <Container fluid>
        <Row>
          <Col sm={2}>
            <Card>
              <Card.Header>
                Actions
              </Card.Header>
              <Card.Body>
                <p><Link to={'/cube/' + this.props.match.params.id + '/patches/'}>Patches</Link></p>
                <p><Link to={'/cube/' + this.props.match.params.id + '/ratings/'}>Ratings</Link></p>
                <p><Link to={'/cube/' + this.props.match.params.id + '/image-records/'}>Image Records</Link></p>
                {
                  this.props.authenticated ? [
                    <p>
                      <Link
                        to={"#"}
                        onClick={() => this.setState({forking: true})}
                      >
                        Fork cube
                      </Link>
                    </p>,
                    <p>
                      <Link
                        to={"#"}
                        onClick={() => this.setState({deleting: true})}
                      >
                        Delete
                      </Link>
                    </p>,
                  ] : undefined
                }
              </Card.Body>
            </Card>
          </Col>
          <Col>
            {cube}
          </Col>
        </Row>
      </Container>
    </>
  }

}


const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
  };
};


const mapDispatchToProps = (dispatch: any) => {
  return {};
};


export default connect(mapStateToProps, mapDispatchToProps)(CubePage);