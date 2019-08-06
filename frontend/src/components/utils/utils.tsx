import React from "react";

import '../../styling/utils.css';

// import MapleToolTip from 'reactjs-mappletooltip';
import {Tooltip} from "react-lightweight-tooltip";

import {Printing, Trap, PrintingNode} from "../models/models";
import {CubeableImage} from "../images";
import ReactTooltip from 'react-tooltip';

const imagesPath = '/api/images/';


export function get_cubeable_images_url(id: string, type = 'printing', size_slug = 'original') {
  return imagesPath + id + '/?type=' + type + '&size_slug=' + size_slug
}

export const get_cardback_image_url = (size_slug = 'original') => {
  return imagesPath + 'back/?size_slug=' + size_slug
};


export interface NoProps {
}

export interface NoState {
}

export const Loading: React.SFC<NoProps> = () => {
  return <h3 className="loading">Loading...</h3>
};


interface PrintingListItemProps {
  printing: Printing
}

export const PrintingListItem: React.SFC<PrintingListItemProps> = (props: PrintingListItemProps) => {
  return <span>
    <a
      data-tip
      data-for={props.printing.id().toString()}
    >
      {props.printing.name()}
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


interface TrapListItemProps {
  trap: Trap
}

const trap_representation = (item: Printing | PrintingNode, trap: Trap | undefined = undefined): any => {
  if (item instanceof Printing) {
    const tooltipId = (
      trap === undefined ?
        item.id().toString()
        : trap.id().toString() + item.id().toString()
    );
    return <span>
    <a
      data-tip
      data-for={tooltipId}
    >
      {item.name()}
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

  return <span>
    (
    {
      item.children().map(
        child => trap_representation(child, trap)
      ).reduce(
        (previous, current) => [previous, item.type() === 'AllNode' ? '; ' : ' || ', current]
      )
    }
    )
  </span>;
};

export const TrapListItem: React.SFC<TrapListItemProps> = (props: TrapListItemProps) => {
  return trap_representation(props.trap.node(), props.trap)
};


interface NodeListItemProps {
  node: PrintingNode
}

export const NodeListItem: React.SFC<NodeListItemProps> = (props: NodeListItemProps) => {
  return trap_representation(props.node)
};