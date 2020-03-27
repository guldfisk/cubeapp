import React from 'react';

import {Loading} from '../../utils/utils';
import {DraftSession,} from '../../models/models';
import DraftView from "../../views/draft/DraftView";


interface DraftPageProps {
  match: any
}

interface DraftPageState {
  draft: DraftSession | null
}

export default class DraftPage extends React.Component<DraftPageProps, DraftPageState> {

  constructor(props: DraftPageProps) {
    super(props);
    this.state = {
      draft: null,
    };
  }

  refresh = (): void => {
    DraftSession.get(this.props.match.params.id).then(
      draft => {
        this.setState({draft});
      }
    );
  };

  componentDidMount() {
    this.refresh()
  }

  render() {
    let sessionView = <Loading/>;
    if (this.state.draft !== null) {
      sessionView = <DraftView
        draft={this.state.draft}
      />
    }

    return sessionView;
  }

}
