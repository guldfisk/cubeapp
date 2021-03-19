import React from 'react';

import {Redirect} from "react-router-dom";

import {Loading} from '../../utils/utils';
import {Cube} from '../../models/models';


interface LatestReleasePageProps {
  match: any
}


interface LatestReleasePageState {
  cube: null | Cube
}


export default class LatestReleasePage extends React.Component<LatestReleasePageProps, LatestReleasePageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      cube: null,
    };
  }

  componentDidMount() {
    Cube.get(this.props.match.params.id).then(
      cube => {
        this.setState({cube})
      }
    );
  }

  render() {
    return this.state.cube ? <Redirect to={'/release/' + this.state.cube.latestRelease().id}/> : <Loading/>;
  }

}
