import React from 'react';


class CubeLIstItem extends React.Component {

  render() {
    return <li
      key={this.props.checksum}
    >
      {this.props.name}
    </li>
  }
}

export default CubeLIstItem;