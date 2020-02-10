import React from 'react';

import CubeablesCollectionListView from '../cubeablescollectionview/CubeablesCollectionListView';
import {SealedPool} from "../../models/models";


interface PoolViewProps {
  pool: SealedPool
}


export default class PoolView extends React.Component<PoolViewProps> {

  render() {
    return <CubeablesCollectionListView
      rawCube={this.props.pool.pool}
      cubeableType={'Cubeables'}
    />

  }
}
