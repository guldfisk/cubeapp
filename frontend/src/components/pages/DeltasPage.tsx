import React from 'react';

import {Delta} from '../models/models';

import DeltasView from '../views/deltaview/DeltasView';


interface DeltasPageState {
  deltas: Delta[]
}

class DeltasPage extends React.Component<null, DeltasPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      deltas: [],
    };
  }

  componentDidMount() {
    Delta.all().then(
      deltas => {
        this.setState({deltas})
      }
    );
  }

  render() {
    return <DeltasView
      deltas={this.state.deltas}
    />
  }

}

export default DeltasPage;