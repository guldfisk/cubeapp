import React from 'react';

import {Loading} from '../../utils/utils';
import {SealedPool} from '../../models/models';
import PoolView from "../../views/sealed/PoolView";


interface PoolPageProps {
  match: any
}

interface PoolPageState {
  pool: SealedPool | null
}

export default class PoolPage extends React.Component<PoolPageProps, PoolPageState> {

  constructor(props: PoolPageProps) {
    super(props);
    this.state = {
      pool: null,
    };
  }

  componentDidMount() {
    SealedPool.get(this.props.match.params.key).then(
      pool => {
        this.setState({pool});
      }
    );
  }

  render() {
    let pool = <Loading/>;
    if (this.state.pool !== null) {
      pool = <PoolView
        pool={this.state.pool}
      />
    }

    return pool;
  }

}
