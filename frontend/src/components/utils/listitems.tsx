import React, {ComponentElement} from "react";
import ReactTooltip from "react-tooltip";

import {Cubeable, CubeChange, Printing, PrintingNode, Purple, Ticket, Trap} from "../models/models";
import {CubeableImage} from "../images";
import ListGroup from "react-bootstrap/ListGroup";
import {Simulate} from "react-dom/test-utils";
import change = Simulate.change;


interface PrintingListItemProps {
  printing: Printing
  multiplicity: number
  onClick?: (printing: Printing, multiplicity: number) => void
  noHover?: boolean
}

export const PrintingListItem: React.SFC<PrintingListItemProps> = (props: PrintingListItemProps) => {
  const display_name = `${(props.multiplicity && props.multiplicity !== 1) ?
    props.multiplicity.toString() + 'x '
    : ''}${props.printing.full_name()}`;

  if (props.noHover) {
    return <a
      onClick={
        props.onClick && (
          () => {
            props.onClick(props.printing, props.multiplicity);
          }
        )
      }
    >
      {display_name}
    </a>
  }

  return <span>
    <a
      data-tip=""
      data-for={props.printing.id.toString()}
      onClick={
        props.onClick && (
          () => {
            props.onClick(props.printing, props.multiplicity);
          }
        )
      }
    >
      {display_name}
    </a>
    <ReactTooltip
      place="top"
      type="dark"
      effect="float"
      id={props.printing.id.toString()}
      className="printing-list-tooltip"
    >
      <CubeableImage
        cubeable={props.printing}
      />
    </ReactTooltip>
  </span>
};


const trap_representation = (
  [item, multiplicity]: [Printing | PrintingNode, number],
  trap: Trap | undefined = undefined,
  onClick: ((trap: Trap, multiplicity: number) => void) | undefined = undefined,
): any => {
  if (item instanceof Printing) {
    const tooltipId = (
      trap === undefined ?
        item.id.toString()
        : trap.id.toString() + item.id.toString()
    );
    return <span>
    <a
      data-tip=""
      data-for={tooltipId}
    >
      {
        `${(multiplicity && multiplicity !== 1) ?
          multiplicity.toString() + '# '
          : ''}${item.full_name()}`
      }
    </a>
    <ReactTooltip
      place="top"
      type="dark"
      effect="float"
      id={tooltipId}
      className="printing-list-tooltip"
    >
      {
        trap === undefined ?
          <span/> : <CubeableImage
            cubeable={trap}
          />
      }
      <CubeableImage
        cubeable={item}
      />
    </ReactTooltip>
  </span>
  }

  return <span
    onClick={
      onClick &&
      (() => onClick(trap, multiplicity))
    }
  >
    (
    {
      item.children.items.map(
        ([child, _multiplicity]) => trap_representation([child, _multiplicity], trap)
      ).reduce(
        (previous, current) => previous.concat([current, item.type === 'AllNode' ? '; ' : ' || ']),
        [],
      ).slice(0, -1)
    }
    )
  </span>;
};


interface TrapListItemProps {
  trap: Trap
  multiplicity: number
  noHover?: boolean
  onClick?: (trap: Trap, multiplicity: number) => void
}

export const TrapListItem: React.SFC<TrapListItemProps> = (props: TrapListItemProps) => {
  const multiplicityIndicator =
    props.multiplicity && props.multiplicity !== 1 &&
    props.multiplicity.toString() + 'x ';

  if (props.noHover) {
    return <a
      onClick={
        props.onClick &&
        (() => {
          props.onClick(props.trap, props.multiplicity)
        })
      }
    >
      {multiplicityIndicator}
      {props.trap.node.representation()}
    </a>
  }
  return <span>
    {multiplicityIndicator}
    {trap_representation([props.trap.node, props.multiplicity], props.trap, props.onClick)}
  </span>
};


interface NodeListItemProps {
  node: PrintingNode
  onClick?: (node: PrintingNode, multiplicity: number) => void
  noHover?: boolean
}

export const NodeListItem: React.SFC<NodeListItemProps> = (props: NodeListItemProps) => {
  if (props.noHover) {
    return <a
      onClick={
        props.onClick &&
        (() => {
          props.onClick(props.node, 1)
        })
      }
    >
      {props.node.representation()}
    </a>
  }
  return <span
    onClick={() => props.onClick(props.node, 1)}
  >
    {
      trap_representation(
        [props.node, 1],
      )
    }
  </span>
};


interface CubeListItemProps {
  cubeable: Cubeable
  multiplicity?: number
  onClick?: (cubeable: Cubeable, multiplicity: number) => void
  noHover?: boolean
}

export const CubeableListItem: React.FunctionComponent<CubeListItemProps> = (props) => {
  let content: string | ComponentElement<any, any> = "";

  if (props.cubeable instanceof Printing) {
    content = <PrintingListItem
      printing={props.cubeable}
      onClick={props.onClick}
      noHover={props.noHover}
      multiplicity={props.multiplicity}
    />

  } else if (props.cubeable instanceof Trap) {
    content = <TrapListItem
      trap={props.cubeable}
      noHover={props.noHover}
      onClick={props.onClick}
      multiplicity={props.multiplicity}
    />

  } else if (props.cubeable instanceof Ticket) {
    content = 'ticket';

  } else if (props.cubeable instanceof Purple) {
    content = props.cubeable.name;

  } else {
    content = 'Unknown cubeable type';
  }

  return <ListGroup.Item
    key={props.cubeable.id}
    className="py-0"
  >
    {content}
  </ListGroup.Item>

};


interface CubeChangeListItemProps {
  change: CubeChange
  multiplicity: number
  onClick?: (change: CubeChange, multiplicity: number) => void
}

export const CubeChangeListItem: React.FunctionComponent<CubeChangeListItemProps> = (props) => {
  return <ListGroup.Item
    key={props.change.id}
    className="py-0"
    onClick={
      !props.onClick ? undefined :
        () => props.onClick(props.change, props.multiplicity)
    }
  >
    {
      (
        props.multiplicity && props.multiplicity !== 1 ? props.multiplicity + 'x ' : ''
      ) + props.change.explanation
    }
  </ListGroup.Item>
};