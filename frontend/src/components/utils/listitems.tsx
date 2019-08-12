import React, {ComponentElement} from "react";
import ReactTooltip from "react-tooltip";

import {Cubeable, Printing, PrintingNode, Purple, Ticket, Trap} from "../models/models";
import {CubeableImage} from "../images";


interface PrintingListItemProps {
  printing: Printing
  multiplicity: number
  onClick?: (printing: Printing) => void
  noHover?: boolean
}

export const PrintingListItem: React.SFC<PrintingListItemProps> = (props: PrintingListItemProps) => {
  const display_name = `${(props.multiplicity && props.multiplicity !== 1) ?
    props.multiplicity.toString() + 'X '
    : ''}${props.printing.full_name()}`;

  if (props.noHover) {
    return <a
      onClick={
        props.onClick && (
          () => {
            props.onClick(props.printing);
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
      data-for={props.printing.id().toString()}
      onClick={
        props.onClick && (
          () => {
            props.onClick(props.printing);
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
      id={props.printing.id().toString()}
      className="printing-list-tooltip"
    >
      <CubeableImage
        cubeable={props.printing}
      />
    </ReactTooltip>
  </span>
};


const trap_representation = (
  item: Printing | PrintingNode,
  trap: Trap | undefined = undefined,
  onClick: ((trap: Trap) => void) | undefined = undefined,
): any => {
  if (item instanceof Printing) {
    const tooltipId = (
      trap === undefined ?
        item.id().toString()
        : trap.id().toString() + item.id().toString()
    );
    return <span>
    <a
      data-tip=""
      data-for={tooltipId}
    >
      {item.full_name()}
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
      (() => onClick(trap))
    }
  >
    (
    {
      item.children().map(
        child => trap_representation(child, trap)
      ).reduce(
        (previous, current) => previous.concat([current, item.type() === 'AllNode' ? '; ' : ' || ']),
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
  onClick?: (printing: Trap) => void
}

export const TrapListItem: React.SFC<TrapListItemProps> = (props: TrapListItemProps) => {
  if (props.noHover) {
    return <a
      onClick={
        props.onClick &&
        (() => {props.onClick(props.trap)})
      }
    >
      {props.trap.node().representation()}
    </a>
  }
  return trap_representation(props.trap.node(), props.trap)
};


interface NodeListItemProps {
  node: PrintingNode
}

export const NodeListItem: React.SFC<NodeListItemProps> = (props: NodeListItemProps) => {
  return trap_representation(props.node)
};


interface CubeListItemProps {
  cubeable: Cubeable
  multiplicity?: number
  onClick?: (cubeable: Cubeable) => void
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
    content = (props.cubeable as Purple).name();

  } else {
    content = 'Unknown cubeable type';
  }

  return <li>
    {content}
  </li>

};