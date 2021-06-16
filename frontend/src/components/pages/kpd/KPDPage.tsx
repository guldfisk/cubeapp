import React from 'react';

import {Loading} from '../../utils/utils';
import {
  KPDPoint,
} from '../../models/models';
import KPDHistoryView from "../../views/kpd/KPDHistoryView";


interface KPDPageProps {
  match: any
}


interface KPDPageState {
  points: KPDPoint[]
}


export default class KPDPage extends React.Component<KPDPageProps, KPDPageState> {

  constructor(props: KPDPageProps) {
    super(props);
    this.state = {
      points: null
    };
  }

  componentDidMount() {
    KPDPoint.getHistory().then(points => this.setState({points}));
  }

  render() {
    return <>
      <h4>How much kebab can one person eat?</h4>
      {
        this.state.points ? <KPDHistoryView points={this.state.points}/> : <Loading/>
      }
    </>
  }
}