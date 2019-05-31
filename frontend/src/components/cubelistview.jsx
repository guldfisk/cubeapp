import React from 'react';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';


const CubeableListItem = (props) => {
  let content = "";
  if (props.cubeable.type === 'printing') {
    content = props.cubeable.name;
  } else if (props.cubeable.type === 'trap') {
    content = props.cubeable.string_representation;
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
                <ul
                  style={
                    {
                      width: '300px'
                    }
                  }
                >
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