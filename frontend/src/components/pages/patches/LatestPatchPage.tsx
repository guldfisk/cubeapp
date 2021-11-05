import React from 'react';

import {Redirect} from "react-router-dom";

import {Loading} from '../../utils/utils';
import {ReleasePatch} from '../../models/models';


interface LatestPatchPageProps {
  match: any
}


interface LatestPatchPageState {
  patch: null | ReleasePatch
  loading: boolean
}


export default class LatestPatchPage extends React.Component<LatestPatchPageProps, LatestPatchPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      patch: null,
      loading: true,
    };
  }

  componentDidMount() {
    ReleasePatch.forCube(
      this.props.match.params.id,
      0,
      1,
    ).then(
      (response) => {
        if (response.hits) {
          this.setState({loading: false, patch: response.objects[0]})
        } else {
          this.setState({loading: false})
        }
      }
    );
  }

  render() {
    return (
      this.state.loading ?
        <Loading/> :
        <Redirect
          to={
            this.state.patch ?
              `/patch/${this.state.patch.id}` :
              `/cube/${this.props.match.params.id}/patches/create`
          }
        />
    );
  }

}
