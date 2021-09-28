import React from 'react';

import {Loading} from '../../utils/utils';
import {
  LogPoint,
} from '../../models/models';
import LogPointsView from "../../views/kpd/LogPointsView";


interface KPDPageProps {
  match: any
}


interface KPDPageState {
  kebabPoints: LogPoint[] | null
  wafflePoints: LogPoint[] | null
}


export default class KPDPage extends React.Component<KPDPageProps, KPDPageState> {

  constructor(props: KPDPageProps) {
    super(props);
    this.state = {
      kebabPoints: null,
      wafflePoints: null,
    };
  }

  componentDidMount() {
    LogPoint.getHistory('kebab').then(points => this.setState({kebabPoints: points}));
    LogPoint.getHistory('waffle').then(points => this.setState({wafflePoints: points}));
  }

  render() {
    return <>
      <h4>How much kebab can one person eat?</h4>
      {
        this.state.kebabPoints ? <LogPointsView points={this.state.kebabPoints} yaxisTitle='Kebab/Day'/> : <Loading/>
      }
      {
        this.state.wafflePoints ? <LogPointsView points={this.state.wafflePoints} yaxisTitle='Waffles/Day'/> : <Loading/>
      }
    </>
  }
}