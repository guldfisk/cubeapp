import React from 'react';

import {ReleasePatch} from '../../models/models';

import PatchesView from '../../views/patchview/PatchesView';


interface DeltasPageState {
  patches: ReleasePatch[]
}

class PatchesPage extends React.Component<null, DeltasPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      patches: [],
    };
  }

  componentDidMount() {
    ReleasePatch.all().then(
      deltas => {
        this.setState({patches: deltas})
      }
    );
  }

  render() {
    return <PatchesView
      patches={this.state.patches}
    />
  }

}

export default PatchesPage;