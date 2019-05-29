import React from 'react';

import CubeListItem from './cubelistitem.jsx';


class CubeList extends React.Component {

  render() {
    console.log(this.props);
    return <div>
      {
        this.props.cubes.map(
          cube => {
            return <CubeListItem
              name={cube.name}
              createdAt={cube.created_at}
              checksum={cube.checksum}
            />
          }
        )
      }
    </div>

  }
}

export default CubeList;