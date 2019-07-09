import "../../../styling/CubeListView.css";

import React from 'react';

import Row from 'react-bootstrap/Row';

import MapleToolTip from 'reactjs-mappletooltip';

import {CubeableImage} from '../../images.jsx';


const TrapItem = (props) => {
  if (props.type === 'printing') {
    return <MapleToolTip>
      <div
        className='TrapItem'
      >
        {props.name}
      </div>
      <div>
        <CubeableImage
         id={props.id}
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
        <div
          onClick={() => console.log(props.cubeable.name)}
        >
          {props.cubeable.name}
        </div>
        <span>
          <CubeableImage
            id={props.cubeable.id}
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


class ReleaseListView extends React.Component {

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
                        // onClick={() => console.log(cubeable)}
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

export default ReleaseListView;