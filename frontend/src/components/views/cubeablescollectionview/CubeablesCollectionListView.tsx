import React, {ComponentElement} from 'react';

import Row from 'react-bootstrap/Row';

import {Trap, Ticket, Purple, Printing, Cubeable, CubeablesContainer, PrintingCollection} from "../../models/models";
import {PrintingListItem, TrapListItem} from "../../utils/utils";


interface CubeListItemProps {
  cubeable: Cubeable
  onClick?: (printing: Printing) => void
  noHover?: boolean
}

const CubeableListItem: React.FunctionComponent<CubeListItemProps> = (props) => {
  let content: string | ComponentElement<any, any> = "";

  if (props.cubeable instanceof Printing) {
    content = <PrintingListItem
      printing={props.cubeable}
      onClick={props.onClick}
      noHover={props.noHover}
    />

  } else if (props.cubeable instanceof Trap) {
    content = <TrapListItem
      trap={props.cubeable}
      noHover={props.noHover}
    />

  } else if (props.cubeable instanceof Ticket) {
    content = 'ticket';

  } else if (props.cubeable instanceof Purple) {
    content = (props.cubeable as Purple).name();

  } else {
    content = 'Unknown cubeable type';
  }

  return <li>
    {content}
  </li>

};


interface RawCubeListViewProps {
  rawCube: CubeablesContainer
  cubeableType: string
  onPrintingClick?: (printing: Printing) => void
  noHover?: boolean
}

class CubeablesCollectionListView extends React.Component<RawCubeListViewProps> {

  render() {
    const groups = (
      this.props.cubeableType === 'Cubeables' ?
        this.props.rawCube.grouped_cubeables()
        : new PrintingCollection(
          [...this.props.rawCube.allPrintings()]
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
                      cubeable => <CubeableListItem
                        cubeable={cubeable}
                        onClick={this.props.onPrintingClick}
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