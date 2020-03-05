import React from 'react';

import {Loading} from '../../utils/utils';
import {Pool} from '../../models/models';
import PoolView from "../../views/limited/PoolView";
import {connect} from "react-redux";


interface PoolPageProps {
  match: any
  loading: boolean
}


interface PoolPageState {
  pool: Pool | null
}


class PoolPage extends React.Component<PoolPageProps, PoolPageState> {
  requested: boolean;

  constructor(props: PoolPageProps) {
    super(props);
    this.requested = false;
    this.state = {
      pool: null,
    };
  }

  render() {
    if (!this.requested && !this.props.loading) {
      this.requested = true;
      Pool.get(this.props.match.params.id).then(
        pool => {
          this.setState({pool});
        }
      );
    }

    let pool = <Loading/>;
    if (this.state.pool !== null) {
      pool = <PoolView
        pool={this.state.pool}
      />
    }

    return pool;
  }

}


const mapStateToProps = (state: any) => {
  return {
    loading: state.loading,
  }
};


const mapDispatchToProps = (dispatch: any) => {
  return {}
};


export default connect(mapStateToProps, mapDispatchToProps)(PoolPage);
