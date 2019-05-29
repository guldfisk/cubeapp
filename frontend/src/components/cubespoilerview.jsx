import React from 'react';
import ReactDOM from 'react-dom';

import {get_printing_image_url, get_trap_image_url} from './utils.jsx';




class CubeSpoilerView extends React.Component {

  render() {
    console.log(this.props);
    return <div
      style={
        {
          display: 'flex',
          flexWrap: 'wrap',
        }
      }
    >
      {
        this.props.cube.cube_content.printings.map(
          printing => {
            return <img
              src={get_printing_image_url(printing)}
              width="370px"
            />
          }
        )
      }
      {
        this.props.cube.cube_content.traps.map(
          trap => {
            return <img
              src={get_trap_image_url(trap)}
              width="370px"
            />
          }
        )
      }
    </div>

  }

}

export default CubeSpoilerView;