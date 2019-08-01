import React from 'react';

import Card from "react-bootstrap/Card";

import {Loading} from "../../utils/utils";
import {Cube, CubeRelease, Delta, Printing} from '../../models/models';
import CubeView from "../cubeview/CubeView";
import SearchView from '../search/SearchView';
// import ReleaseListView from "../releaseview/ReleaseListView";
import Row from "react-bootstrap/Row";
import {Col} from "react-bootstrap";


interface DeltaViewProps {
  delta: Delta
}

class DeltaView extends React.Component<DeltaViewProps, null> {

  constructor(props: DeltaViewProps) {
    super(props);
  }

  render() {

    return <Row>
      <Col>
        <ul>
          {
            this.props.delta.printings().filter(
              ([_, multiplicity]: [Printing, number]) => multiplicity > 0
            ).map(
              ([printing, multiplicity]: [Printing, number]) => <li>
                <span
                  style={
                    {
                      color: 'green',
                    }
                  }
                >
                  {'+' + multiplicity.toString() + 'x ' + printing.name()}
                </span>
              </li>
            )
          }
        </ul>
      </Col>
      <Col>
        <ul>
          {
            this.props.delta.printings().filter(
              ([_, multiplicity]: [Printing, number]) => multiplicity < 0
            ).map(
              ([printing, multiplicity]: [Printing, number]) => <li>
                <span
                  style={
                    {
                      color: 'red',
                    }
                  }
                >
                  {multiplicity.toString() + 'x ' + printing.name()}
                </span>
              </li>
            )
          }
        </ul>
      </Col>
    </Row>

    // return <Card>
    //   <Card.Header className="panel-heading">
    //     <span className="badge badge-secondary">{this.props.delta.description()}</span>
    //     <span className="badge badge-secondary">{this.props.delta.author().username()}</span>
    //     <span className="badge badge-secondary">{this.props.delta.createdAt()}</span>
    //   </Card.Header>
    //   <Card.Body className="panel-body">
    //     <Row>
    //       <Col>
    //       <SearchView
    //         handleCardClicked={
    //           (printing: Printing) => {
    //             this.setState(
    //               {
    //                 printings: this.state.printings.concat([printing,])
    //               }
    //             )
    //           }
    //         }
    //       />
    //     </Col>
    //     <Col>
    //       <ul>
    //         {
    //           this.state.printings.map(
    //             (printing: Printing) => <li>{printing.name()}</li>
    //           )
    //         }
    //       </ul>
    //     </Col>
    //     </Row>
    //   </Card.Body>
    // </Card>

  }

}

export default DeltaView;