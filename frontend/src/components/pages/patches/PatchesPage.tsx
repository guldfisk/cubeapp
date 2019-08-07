import React from 'react';

import {Patch} from '../../models/models';

import PatchesView from '../../views/patchview/PatchesView';


interface DeltasPageState {
  patches: Patch[]
}

class PatchesPage extends React.Component<null, DeltasPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      patches: [],
    };
  }

  componentDidMount() {
    Patch.all().then(
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