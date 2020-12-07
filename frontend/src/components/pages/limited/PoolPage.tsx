import React from 'react';

import {Loading, NotAllowed} from '../../utils/utils';
import {Pool} from '../../models/models';
import PoolView from "../../views/limited/PoolView";
import {connect} from "react-redux";
import queryString from "query-string";


interface PoolPageProps {
  match: any
  loading: boolean
  location: any
}


interface PoolPageState {
  pool: Pool | null
  notAllowed: boolean
}


class PoolPage extends React.Component<PoolPageProps, PoolPageState> {
  requested: boolean;

  constructor(props: PoolPageProps) {
    super(props);
    this.requested = false;
    this.state = {
      pool: null,
      notAllowed: false,
    };
  }

  getCode = (): string => {
    const queryOptions = queryString.parse(this.props.location.search);
    return !queryOptions['code'] ?
      ""
      : (queryOptions['code'] instanceof Array ?
          queryOptions['code'][0]
          : queryOptions['code']
      ) as string;
  };

  render() {
    const code = this.getCode();
    if (!this.requested && !this.props.loading) {
      this.requested = true;
      Pool.get(this.props.match.params.id, code).then(
        pool => {
          this.setState({pool});
        }
      ).catch(
        () => this.setState({notAllowed: true})
      );
    }

    if (this.state.notAllowed) {
      return <NotAllowed/>
    }

    let pool = <Loading/>;
    if (this.state.pool !== null) {
      pool = <PoolView
        pool={this.state.pool}
        code={code}
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
