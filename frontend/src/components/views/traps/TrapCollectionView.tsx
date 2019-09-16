import React from 'react';

import {
  TrapCollection
} from "../../models/models";
import {CubeableListItem} from "../../utils/listitems";
import ListGroup from "react-bootstrap/ListGroup";


interface TrapCollectionViewProps {
  trapCollection: TrapCollection
}

export default class TrapCollectionView extends React.Component<TrapCollectionViewProps> {

  render() {

    return <ListGroup variant="flush">
      {
        Array.from(this.props.trapCollection.traps.items()).map(
          ([trap, multiplicity]) => <CubeableListItem
            cubeable={trap}
            multiplicity={multiplicity}
            noHover={true}
          />
        )
      }
    </ListGroup>

  }
}