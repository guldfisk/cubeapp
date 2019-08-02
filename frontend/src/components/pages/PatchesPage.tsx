import React from 'react';

import {Patch} from '../models/models';

import PatchesView from '../views/patchview/PatchesView';


interface DeltasPageState {
  deltas: Patch[]
}

class PatchesPage extends React.Component<null, DeltasPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      deltas: [],
    };
  }

  componentDidMount() {
    Patch.all().then(
      deltas => {
        this.setState({deltas})
      }
    );
  }

  render() {
    return <PatchesView
      deltas={this.state.deltas}
    />
  }

}

export default PatchesPage;