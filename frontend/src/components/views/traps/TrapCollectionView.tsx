import React from 'react';

import {
  TrapCollection
} from "../../models/models";
import {ImageableListItem} from "../../utils/listitems";
import ListGroup from "react-bootstrap/ListGroup";


interface TrapCollectionViewProps {
  trapCollection: TrapCollection
}

export default class TrapCollectionView extends React.Component<TrapCollectionViewProps> {

  render() {

    return <ListGroup variant="flush">
      {
        Array.from(this.props.trapCollection.traps.items()).map(
          ([trap, multiplicity]) => <ImageableListItem
            cubeable={trap}
            multiplicity={multiplicity}
            noHover={false}
          />
        )
      }
    </ListGroup>

  }
}