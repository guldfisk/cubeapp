import React from 'react';

import {PrintingListItem} from "../../utils/listitems";
import {Patch, Printing} from '../../models/models';
import Row from "react-bootstrap/Row";
import {Col} from "react-bootstrap";
import CubeablesCollectionListView from "../cubeablescollectionview/CubeablesCollectionListView";


interface DeltaViewProps {
  patch: Patch
  onPrintingClicked?: (printing: Printing, amount: number) => void
}

class PatchView extends React.Component<DeltaViewProps, null> {

  constructor(props: DeltaViewProps) {
    super(props);
  }

  render() {

    return <Row>
      {/*<Col>*/}
      {/*  <CubeablesCollectionListView*/}
      {/*    rawCube={}*/}
      {/*    cubeableType={"Cubeables"}*/}
      {/*  />*/}
      {/*</Col>*/}
      {/*<Col></Col>*/}
    </Row>
  }

  //   return <Row>
  //     <Col>
  //       <ul>
  //         {
  //           Array.from(this.props.patch.printings().items()).filter(
  //             ([_, multiplicity]: [Printing, number]) => multiplicity > 0
  //           ).map(
  //             ([printing, multiplicity]: [Printing, number]) => <li>
  //               <span
  //                 style={
  //                   {
  //                     color: 'green',
  //                   }
  //                 }
  //               >
  //                 {'+' + multiplicity.toString() + 'x '}
  //                 <PrintingListItem
  //                   printing={printing}
  //                   onClick={
  //                     this.props.onPrintingClicked && (
  //                       (printing: Printing) => {
  //                         this.props.onPrintingClicked(printing, -1);
  //                       }
  //                     )
  //                   }
  //                 />
  //               </span>
  //             </li>
  //           )
  //         }
  //       </ul>
  //     </Col>
  //     <Col>
  //       <ul>
  //         {
  //           Array.from(this.props.patch.printings().items()).filter(
  //             ([_, multiplicity]: [Printing, number]) => multiplicity < 0
  //           ).map(
  //             ([printing, multiplicity]: [Printing, number]) => <li>
  //               <span
  //                 style={
  //                   {
  //                     color: 'red',
  //                   }
  //                 }
  //               >
  //                 {multiplicity.toString() + 'x '}
  //                 <PrintingListItem
  //                   printing={printing}
  //                   onClick={
  //                     this.props.onPrintingClicked && (
  //                       (printing: Printing) => {
  //                         this.props.onPrintingClicked(printing, 1);
  //                       }
  //                     )
  //                   }
  //                 />
  //               </span>
  //             </li>
  //           )
  //         }
  //       </ul>
  //     </Col>
  //   </Row>
  //
  // }

}

export default PatchView;