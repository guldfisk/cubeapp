import React from 'react';

import {Delta} from '../models/models.js';

import DeltasView from '../views/deltaview/DeltasView.jsx';


class DeltasPage extends React.Component {

  constructor(props) {
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