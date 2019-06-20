import "../styling/CubeListView.css";

import React from 'react';

import Row from 'react-bootstrap/Row';

import MapleToolTip from 'reactjs-mappletooltip';
import ReactTooltip from 'react-tooltip';

import {get_cubeable_images_url} from "./utils.jsx";


const TrapItem = (props) => {
  if (props.type === 'printing') {
    return <MapleToolTip>
      <div
        className='TrapItem'
      >
        {props.name}
      </div>
      <div>
        <img
          src={
            get_cubeable_images_url(
              props.id,
              'printing',
              'medium',
            )
          }
        />
      </div>
    </MapleToolTip>
  } else if (props.type === 'AllNode') {
    return <div
      className='TrapItem'
    >
      ({
        props.children.map(
          child => <TrapItem {...child}/>
        )
      })
    </div>
  } else if (props.type === 'AnyNode') {
    return <div
      className='TrapItem'
    >
      [{
        props.children.map(
          child => <TrapItem {...child}/>
        )
      }]
    </div>
  } else {
    throw 'Invalid trap item type: ' + props.type;
  }
};


const CubeableListItem = (props) => {
  let content = "";

  if (props.cubeable.type === 'printing') {
    content = <MapleToolTip>
      <div>
        {props.cubeable.name}
      </div>
      <span>
        <img
          // width='372px'
          // height='520px'
          src={
            get_cubeable_images_url(
              props.cubeable.id,
              'printing',
              'medium',
            )
          }
        />
      </span>
    </MapleToolTip>

  } else if (props.cubeable.type === 'trap') {
    content = <TrapItem {...props.cubeable.node}/>

  } else if (props.cubeable.type === 'ticket') {
    content = 'ticket';

  } else if (props.cubeable.type === 'purple') {
    content = props.cubeable.name;

  } else {
    content = 'Unknown cubeable type';
  }

  return <li>
    {content}
  </li>

};


class CubeListView extends React.Component {

  render() {
    return <div
    >
      <Row>
        {
          this.props.cube.grouped_cubeables().map(
            group => {
              return <div>
                <ul>
                  {
                    group.map(
                      cubeable => <CubeableListItem
                        cubeable={cubeable}
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

export default CubeListView;