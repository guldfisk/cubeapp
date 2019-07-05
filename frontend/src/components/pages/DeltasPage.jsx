import axios from 'axios';
import React from 'react';

import {Delta} from '../models/models.js';
import {get_api_path} from '../utils.jsx';

import DeltasView from '../deltaview/DeltasView.jsx';


class DeltasPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      deltas: [],
    };
  }

  componentDidMount() {

    axios.get(get_api_path() + 'deltas/').then(
      response => {
        this.setState(
          {
            deltas: response.data.results.map(
              delta => new Delta(delta)
            )
          }
        );
      }
    )

  }

  render() {
    return <DeltasView
      deltas={this.state.deltas}
    />
  }

}

export default DeltasPage;