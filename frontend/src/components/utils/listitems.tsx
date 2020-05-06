import React, {ComponentElement} from "react";
import ReactTooltip from "react-tooltip";
import dateFormat from 'dateformat';

import {Cardboard, Cubeable, CubeChange, Printing, PrintingNode, Purple, Ticket, Trap} from "../models/models";
import {ImageableImage} from "../images";
import ListGroup from "react-bootstrap/ListGroup";


export const PrintingsTooltip: React.SFC = (props: any) => {
  return <ReactTooltip
    place="bottom"
    type="dark"
    effect="float"
    id='printing-tt'
    className="printing-list-tooltip"
    getContent={
      (id: string) => <ImageableImage
        id={id}
        type='Printing'
      />
    }
  />
};


export const CardboardTooltip: React.SFC = (props: any) => {
  return <ReactTooltip
    place="bottom"
    type="dark"
    effect="float"
    id='cardboard-tt'
    className="printing-list-tooltip"
    getContent={
      (id: string) => <ImageableImage
        id={id}
        type='Cardboard'
      />
    }
  />
};


export const TrapTooltip: React.SFC = (props: any) => {
  return <ReactTooltip
    place="bottom"
    type="dark"
    effect="float"
    id='trap-tt'
    className="printing-list-tooltip"
    getContent={
      (dataTip: string) => {
        if (!dataTip) {
          return <div/>
        }
        const [trapId, printingId] = dataTip.split('/');
        return <span>
          {
            trapId && <ImageableImage
              id={trapId}
              type='Trap'
            />
          }
          <ImageableImage
            id={printingId}
            type='printing'
          />
      </span>
      }

    }
  />
};


interface DateListItemProps {
  date: Date
}


export const DateListItem: React.SFC<DateListItemProps> = (props: DateListItemProps) => {
  const short = dateFormat(props.date, 'dd/mm/yy');
  const long = props.date.toUTCString();
  return <span>
    <a
      data-tip=""
      data-for={long}
    >
      {short}
    </a>
    <ReactTooltip
      place="top"
      type="dark"
      effect="float"
      id={long}
      className="date-list-tooltip"
    >
      {long}
    </ReactTooltip>
  </span>
};


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
      data-for='printing-tt'
      data-tip={props.printing.id.toString()}
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
  </span>
};


interface CardboardListItemProps {
  cardboard: Cardboard
  multiplicity: number
  onClick?: (cardboard: Cardboard, multiplicity: number) => void
  noHover?: boolean
}


export const CardboardListItem: React.SFC<CardboardListItemProps> = (props: CardboardListItemProps) => {
  const display_name = `${(props.multiplicity && props.multiplicity !== 1) ?
    props.multiplicity.toString() + 'x '
    : ''}${props.cardboard.name}`;

  if (props.noHover) {
    return <a
      onClick={
        props.onClick && (
          () => {
            props.onClick(props.cardboard, props.multiplicity);
          }
        )
      }
    >
      {display_name}
    </a>
  }

  return <a
    data-tip={props.cardboard.id.toString()}
    data-for='cardboard-tt'
    onClick={
      props.onClick && (
        () => {
          props.onClick(props.cardboard, props.multiplicity);
        }
      )
    }
  >
    {display_name}
  </a>
};


const trap_representation = (
  [item, multiplicity]: [Printing | PrintingNode, number],
  trap: Trap | undefined = undefined,
  onClick: ((trap: Trap, multiplicity: number) => void) | undefined = undefined,
): any => {
  if (item instanceof Printing) {

    return <span>
    <a
      data-tip={(trap ? trap.id.toString() : '') + '/' + item.id.toString()}
      data-for='trap-tt'
    >
      {
        `${(multiplicity && multiplicity !== 1) ?
          multiplicity.toString() + '# '
          : ''}${item.full_name()}`
      }
    </a>
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


interface PurpleListItemProps {
  purple: Purple
  multiplicity: number
  onClick?: (purple: Purple, multiplicity: number) => void
  noHover?: boolean
}


export const PurpleListItem: React.SFC<PurpleListItemProps> = (props) => {
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
    content = 'ticket';

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