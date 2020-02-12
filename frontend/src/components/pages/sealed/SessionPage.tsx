import React from 'react';

import {Loading} from '../../utils/utils';
import {FullSealedSession} from '../../models/models';
import SessionView from "../../views/sealed/SessionView";


interface sessionPageProps {
  match: any
}

interface SessionPageState {
  session: FullSealedSession | null
}

export default class SessionPage extends React.Component<sessionPageProps, SessionPageState> {

  constructor(props: sessionPageProps) {
    super(props);
    this.state = {
      session: null,
    };
  }

  componentDidMount() {
    FullSealedSession.get(this.props.match.params.id).then(
      session => {
        this.setState({session});
      }
    );
  }

  render() {
    let sessionView = <Loading/>;
    if (this.state.session !== null) {
      sessionView = <SessionView
        session={this.state.session}
      />
    }

    return sessionView;
  }

}
