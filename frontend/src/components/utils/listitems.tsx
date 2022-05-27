import React, {ComponentElement} from "react";

import dateFormat from 'dateformat';
import ListGroup from "react-bootstrap/ListGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import {flip, preventOverflow} from "@popperjs/core";
import {Tooltip} from "react-bootstrap";

import {
  Cardboard,
  Cubeable,
  CubeChange,
  Printing,
  PrintingNode,
  Purple,
  Ticket,
  Trap
} from "../models/models";
import {ImageableImage} from "../images";


interface DateListItemProps {
  date: Date
}


export const DateListItem: React.FunctionComponent<DateListItemProps> = (props: DateListItemProps) => {
  return <OverlayTrigger
    placement="top"
    delay={{show: 0, hide: 0}}
    overlay={
      (_props: any) => <Tooltip id='date-item' {..._props}>
        {props.date.toLocaleString()}
      </Tooltip>
    }
    popperConfig={{
      modifiers: [flip, preventOverflow],
    }}
  >
    <span>{dateFormat(props.date, 'dd/mm/yy')}</span>
  </OverlayTrigger>
};


interface PrintingListItemProps {
  printing: Printing
  multiplicity: number
  onClick?: (printing: Printing, multiplicity: number) => void
  noHover?: boolean
}


export const PrintingListItem: React.FunctionComponent<PrintingListItemProps> = (props: PrintingListItemProps) => {
  const display_name = `${(props.multiplicity && props.multiplicity !== 1) ?
    props.multiplicity.toString() + 'x '
    : ''}${props.printing.fullName()}`;

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

  return <OverlayTrigger
    placement='left'
    delay={{show: 250, hide: 0}}
    overlay={
      <ImageableImage
        id={props.printing.id}
        type='Printing'
        hover={false}
      />
    }
    popperConfig={{
      modifiers: [flip, preventOverflow],
    }}
  >
    <span
      onClick={
        props.onClick && (
          () => {
            props.onClick(props.printing, props.multiplicity);
          }
        )
      }
    >
      {display_name}
    </span>
  </OverlayTrigger>
};


interface CardboardListItemProps<T extends string | Cardboard> {
  cardboard: T
  multiplicity: number
  onClick?: (cardboard: T, multiplicity: number) => void
  noHover?: boolean
}


export class CardboardListItem<T extends string | Cardboard> extends React.Component<CardboardListItemProps<T>> {
  render() {
    const cardboard_name = (
      this.props.cardboard instanceof Cardboard ? this.props.cardboard.name : this.props.cardboard
    ) as string
    const display_name = `${(this.props.multiplicity && this.props.multiplicity !== 1) ?
      this.props.multiplicity.toString() + 'x '
      : ''}${cardboard_name}`;

    if (this.props.noHover) {
      return <span
        onClick={
          this.props.onClick && (
            () => {
              this.props.onClick(this.props.cardboard, this.props.multiplicity);
            }
          )
        }
      >
        {display_name}
      </span>
    }

    return <OverlayTrigger
      placement='left'
      delay={{show: 250, hide: 0}}
      overlay={
        <ImageableImage
          id={cardboard_name}
          type='Cardboard'
          hover={false}
        />
      }
      popperConfig={{
        modifiers: [flip, preventOverflow],
      }}
    >
      <span
        onClick={
          this.props.onClick && (
            () => {
              this.props.onClick(this.props.cardboard, this.props.multiplicity);
            }
          )
        }
      >
        {display_name}
      </span>
    </OverlayTrigger>
  }
}


const trap_representation = (
  [item, multiplicity]: [Printing | PrintingNode, number],
  trap: Trap | null = null,
  key: string,
  onClick: ((trap: Trap, multiplicity: number) => void) | null = null,
): any => {
  if (item instanceof Printing) {
    return <OverlayTrigger
      key={key}
      placement='left'
      delay={{show: 250, hide: 0}}
      overlay={
        <div>
          {
            trap && <ImageableImage
              imageable={trap}
              type='Trap'
            />
          }
          <ImageableImage
            id={item.id}
            type='printing'
          />
        </div>
      }
      popperConfig={{
        modifiers: [flip, preventOverflow],
      }}
    >
      <span
        onClick={
          onClick && (
            () => {
              onClick(trap, multiplicity);
            }
          )
        }
      >
        {
          `${(multiplicity && multiplicity !== 1) ?
            multiplicity.toString() + '# '
            : ''}${item.fullName()}`
        }
      </span>
    </OverlayTrigger>
  }

  return <span
    key={key}
    onClick={
      onClick &&
      (() => onClick(trap, multiplicity))
    }
  >
    (
    {
      item.children.items.map(
        ([child, _multiplicity], idx) => trap_representation(
          [child, _multiplicity],
          trap,
          `${key}-${idx}`,
        )
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


export const TrapListItem: React.FunctionComponent<TrapListItemProps> = (props: TrapListItemProps) => {
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
    {trap_representation([props.trap.node, props.multiplicity], props.trap, '0', props.onClick)}
  </span>
};


interface NodeListItemProps {
  node: PrintingNode
  onClick?: (node: PrintingNode, multiplicity: number) => void
  noHover?: boolean
}

export const NodeListItem: React.FunctionComponent<NodeListItemProps> = (props: NodeListItemProps) => {
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
    onClick={props.onClick && (() => props.onClick(props.node, 1))}
  >
    {
      trap_representation(
        [props.node, 1], null, '0'
      )
    }
  </span>
};


interface TicketListItemProps {
  ticket: Ticket
  multiplicity: number
  onClick?: (purple: Ticket, multiplicity: number) => void
  noHover?: boolean
}


export const TicketListItem: React.SFC<TicketListItemProps> = (props) => {
  const display_name = `${(props.multiplicity && props.multiplicity !== 1) ?
    props.multiplicity.toString() + 'x '
    : ''}${props.ticket.name}`;

  return <a
    onClick={
      props.onClick && (
        () => {
          props.onClick(props.ticket, props.multiplicity);
        }
      )
    }
  >
    {display_name}
  </a>;
};


interface PurpleListItemProps {
  purple: Purple
  multiplicity: number
  onClick?: (purple: Purple, multiplicity: number) => void
  noHover?: boolean
}


export const PurpleListItem: React.FunctionComponent<PurpleListItemProps> = (props) => {
  const display_name = `${(props.multiplicity && props.multiplicity !== 1) ?
    props.multiplicity.toString() + 'x '
    : ''}${props.purple.name}`;

  return <a
    onClick={
      props.onClick && (
        () => {
          props.onClick(props.purple, props.multiplicity);
        }
      )
    }
  >
    {display_name}
  </a>;
};


interface CubeListItemProps {
  cubeable: Cubeable
  multiplicity?: number
  onClick?: (cubeable: Cubeable, multiplicity: number) => void
  noHover?: boolean
}


export const ImageableListItem: React.FunctionComponent<CubeListItemProps> = (props) => {
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

  } else if (props.cubeable instanceof Cardboard) {
    content = <CardboardListItem
      cardboard={props.cubeable}
      noHover={props.noHover}
      onClick={props.onClick}
      multiplicity={props.multiplicity}
    />

  } else if (props.cubeable instanceof Ticket) {
    content = <TicketListItem
      ticket={props.cubeable}
      noHover={props.noHover}
      onClick={props.onClick}
      multiplicity={props.multiplicity}
    />

  } else if (props.cubeable instanceof Purple) {
    content = <PurpleListItem
      purple={props.cubeable}
      noHover={props.noHover}
      onClick={props.onClick}
      multiplicity={props.multiplicity}
    />

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
    className="py-0"
    onClick={
      props.onClick && (() => props.onClick(props.change, props.multiplicity))
    }
  >
    {
      (
        props.multiplicity && props.multiplicity !== 1 ? props.multiplicity + 'x ' : ''
      ) + props.change.explanation
    }
  </ListGroup.Item>
};