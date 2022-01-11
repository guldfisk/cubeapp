import React from 'react';

import {
  BaseNode,
  Printing,
  PrintingNode,
} from "../../models/models";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import {PrintingListItem} from "../../utils/listitems";
import {MultiplicityList} from "../../models/utils";
import {PrintingSearchView} from "../search/SearchView";


interface NodeTreePrintingProps {
  printing: Printing
}


interface NodeTreePrintingState {
}

class NodeTreePrinting extends React.Component<NodeTreePrintingProps, NodeTreePrintingState> {

  render() {
    return <Card>
      <Card.Header>
        <PrintingListItem printing={this.props.printing} multiplicity={1}/>
      </Card.Header>
    </Card>
  }

}


interface NodeTreeBuilderProps {
  node: PrintingNode
  changed: (node: PrintingNode) => any
}


interface NodeTreeBuilderState {
  showPrintingSelector: boolean
}


export class NodeTreeBuilder extends React.Component<NodeTreeBuilderProps, NodeTreeBuilderState> {

  constructor(props: NodeTreeBuilderProps) {
    super(props);
    this.state = {
      showPrintingSelector: false,
    }
  }

  render() {
    return <Card>
      <Card.Header
        className="d-flex justify-content-between panel-heading"
      >
        {this.props.node.type}
        <Button
          onClick={
            () => this.props.changed(
              new PrintingNode(
                null,
                this.props.node.children,
                this.props.node.type === 'AllNode' ? 'AnyNode' : 'AllNode',
              )
            )
          }
        >
          Swap
        </Button>
      </Card.Header>
      <Card.Body>
        <table>
          {
            this.props.node.children.items.map(
              ([child, multiplicity]) => <tr>
                <td
                  style={{verticalAlign: 'top'}}
                >
                  <input
                    type="number"
                    value={multiplicity}
                    style={{width: '4em'}}
                    min={0}
                    onChange={
                      event => this.props.changed(
                        new PrintingNode(
                          null,
                          new MultiplicityList(
                            this.props.node.children.items.map(
                              ([_child, _multiplicity]): [PrintingNode | Printing, number] => (
                                [_child, child === _child ? parseInt(event.target.value) : _multiplicity]
                              )
                            ).filter(([, m]) => m > 0)
                          ),
                          this.props.node.type,
                        )
                      )
                    }
                  />
                </td>
                <td
                  style={{width: '100%'}}
                >
                  {
                    child instanceof Printing ? <NodeTreePrinting printing={child}/> :
                      <NodeTreeBuilder
                        node={child}
                        changed={
                          (node: PrintingNode) => this.props.changed(
                            new PrintingNode(
                              null,
                              new MultiplicityList<BaseNode<Printing> | Printing>(
                                this.props.node.children.items.map(
                                  ([_child, _multiplicity]) => (
                                    [_child === child ? node : _child, _multiplicity]
                                  )
                                )
                              ),
                              this.props.node.type,
                            )
                          )
                        }
                      />
                  }
                </td>
              </tr>
            )
          }
        </table>
        <Button
          onClick={
            () => this.props.changed(
              new PrintingNode(
                null,
                new MultiplicityList(
                  this.props.node.children.items.concat(
                    [
                      [
                        new PrintingNode(null, new MultiplicityList(), 'AllNode'),
                        1,
                      ]
                    ]
                  )
                ),
                this.props.node.type,
              )
            )
          }
        >
          +Node
        </Button>
        <Button onClick={() => this.setState({showPrintingSelector: true})}>+Printing</Button>
        <Button
          onClick={
            () => this.props.changed(new PrintingNode(null, new MultiplicityList(), this.props.node.type))
          }
        >
          Clear
        </Button>
        {
          this.state.showPrintingSelector && <>
            <PrintingSearchView
              handleCubeableClicked={
                (printing: Printing) => this.props.changed(
                  new PrintingNode(
                    null,
                    new MultiplicityList(
                      this.props.node.children.items.some(
                        ([i, m]) => i instanceof Printing && i.id === printing.id
                      ) ?
                        this.props.node.children.items.map(
                          ([i, m]) => [
                            i,
                            i instanceof Printing && i.id === printing.id ? m + 1 : m,
                          ]
                        ) :
                        this.props.node.children.items.concat(
                          [
                            [
                              printing,
                              1,
                            ]
                          ]
                        ),
                    ),
                    this.props.node.type,
                  )
                )
              }
              limit={3}
            />
            <Button onClick={() => this.setState({showPrintingSelector: false})}>Close</Button>
          </>
        }
      </Card.Body>
    </Card>
  }

}

