import React from "react";

import '../../styling/utils.css';

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


export const Loading: React.SFC = () => {
  return <h3 className="loading">Loading...</h3>
};


interface PrintingListItemProps {
  printing: Printing
  onClick?: (printing: Printing) => void
  noHover?: boolean
}

export const PrintingListItem: React.SFC<PrintingListItemProps> = (props: PrintingListItemProps) => {
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
      {props.printing.full_name()}
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
      {props.printing.full_name()}
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
  noHover?: boolean
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

  return <span>
    {
      item.children().map(
        child => trap_representation(child, trap)
      ).reduce(
        (previous, current) => [previous, item.type() === 'AllNode' ? '; ' : ' || ', current]
      )
    }
  </span>;
};

export const TrapListItem: React.SFC<TrapListItemProps> = (props: TrapListItemProps) => {
  if (props.noHover) {
    return <a>trap</a>
  }
  return trap_representation(props.trap.node(), props.trap)
};


interface NodeListItemProps {
  node: PrintingNode
}

export const NodeListItem: React.SFC<NodeListItemProps> = (props: NodeListItemProps) => {
  return trap_representation(props.node)
};