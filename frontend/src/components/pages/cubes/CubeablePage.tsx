import React from 'react';

import {Link} from "react-router-dom";

import history from '../../routing/history';
import {Loading} from '../../utils/utils';
import CubeView from '../../views/cubeview/CubeView';
import {Cube, Cubeable, MinimalCube} from '../../models/models';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import {ConfirmationDialog} from "../../utils/dialogs";
import {Modal} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import CreateCubeForm from "../../views/cubeview/CreateCubeForm";
import {connect} from "react-redux";
import {ImageableImage} from "../../images";


interface CubeablePageProps {
  match: any
}


interface CubeablePageState {
  // cubeable: Cubeable
}


export default class CubeablePage extends React.Component<CubeablePageProps, CubeablePageState> {

  constructor(props: CubeablePageProps) {
    super(props);
    // this.state = {
    //   cube: null,
    //   deleting: false,
    //   forking: false,
    //   forkPending: false,
    // };
  }


  render() {

    return <ImageableImage />

  }

}