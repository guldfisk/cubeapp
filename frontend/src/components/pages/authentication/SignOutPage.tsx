import React from 'react';
import { Redirect } from 'react-router-dom'

import {connect} from "react-redux";

import {signOut} from '../../auth/controller';

interface SignOutPageProps {
  authenticated: boolean
  token: string
  signOut: (token: string) => void
}

class SignOutPage extends React.Component<SignOutPageProps> {

  componentDidMount() {
    if (this.props.authenticated) {
      this.props.signOut(this.props.token)
    }
  }

  render() {
    return <Redirect to="/"/>
  }

}

const mapStateToProps = (state: any) => {
  return {
    authenticated: state.authenticated,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    signOut: (token: string) => {
      return dispatch(signOut(token));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignOutPage);
