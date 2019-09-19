import React from 'react';
import {CubeRelease, Patch, VerbosePatch} from "../models/models";
import PatchMultiView from "../views/patchview/PatchMultiView";
import {Loading} from "../utils/utils";


interface ReleaseComparePageProps {
  match: any
}


interface ReleaseComparePageState {
  patch: Patch | null
  verbosePatch: VerbosePatch | null
}


export default class ReleaseComparePage extends React.Component<ReleaseComparePageProps, ReleaseComparePageState> {

  constructor(props: ReleaseComparePageProps) {
    super(props);
    this.state = {
      patch: null,
      verbosePatch: null,
    }
  }

  componentDidMount(): void {
    CubeRelease.compare(
      this.props.match.params.id_from,
      this.props.match.params.id,
    ).then(
      ([patch, verbosePatch]) => {
        this.setState({patch, verbosePatch})
      }
    )
  }

  render() {
    return !this.state.patch ? <Loading/> : <PatchMultiView
      patch={this.state.patch}
      verbosePatch={this.state.verbosePatch}
    />
  }

}