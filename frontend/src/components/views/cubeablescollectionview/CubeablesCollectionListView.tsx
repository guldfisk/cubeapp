import React from 'react';

import Row from 'react-bootstrap/Row';

import {CubeablesContainer, PrintingCollection, Cubeable} from "../../models/models";
import {CubeableListItem} from "../../utils/listitems";


interface RawCubeListViewProps {
  rawCube: CubeablesContainer
  cubeableType: string
  onCubeableClicked?: (cubeable: Cubeable) => void
  noHover?: boolean
}

class CubeablesCollectionListView extends React.Component<RawCubeListViewProps> {

  render() {
    const groups = (
      this.props.cubeableType === 'Cubeables' ?
        this.props.rawCube.grouped_cubeables()
        : PrintingCollection.collectFromIterable(
          this.props.rawCube.allPrintings()
        ).grouped_printings()
    );

    return <div>
      <Row>
        {
          groups.map(
            group => {
              return <div>
                <ul>
                  {
                    group.map(
                      ([cubeable, multiplicity]) => <CubeableListItem
                        cubeable={cubeable}
                        multiplicity={multiplicity}
                        onClick={this.props.onCubeableClicked}
                        noHover={this.props.noHover}
                      />
                    )
                  }
                </ul>
              </div>
            }
          )
        }
      </Row>
    </div>
  }
}

export default CubeablesCollectionListView;