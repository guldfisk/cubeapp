import React from "react";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import {Cube, MinimalCube, PackImageRecord} from "../../models/models";
import PackImageRecordView from "../../views/imgrecords/PackImageRecordView";
import PaginationBar from "../../utils/PaginationBar";
import {range} from "../../utils/utils";
import {Link} from "react-router-dom";


interface CubeImageRecordsPageProps {
  match: any
}


interface CubeImageRecordsPageState {
  versionedCube: MinimalCube | null
  records: PackImageRecord[]
  offset: number
  limit: number
  hits: number
}


export default class CubeImageRecordsPage extends React.Component<CubeImageRecordsPageProps, CubeImageRecordsPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      versionedCube: null,
      records: [],
      offset: 0,
      limit: 5,
      hits: 0,
    };
  }

  componentDidMount() {
    this.fetch();
  }

  fetch = (offset: number = 0) => {
    PackImageRecord.listForRelease(
      this.props.match.params.id,
      offset,
      this.state.limit,
    ).then(
      ({objects, hits}) => {
        this.setState(
          {
            records: objects,
            hits,
            offset,
          }
        )
      }
    );
    Cube.get(this.props.match.params.id).then(versionedCube => this.setState({versionedCube}));
  };

  render() {
    return <Col>
      {
        this.state.versionedCube && <h3>
          Image records for&nbsp;
          <Link
            to={'/cube/' + this.state.versionedCube.id}
          >
            {this.state.versionedCube.name}
          </Link>
        </h3>
      }
      <Row>
        <PaginationBar
          hits={this.state.hits}
          offset={this.state.offset}
          handleNewOffset={this.fetch}
          pageSize={this.state.limit}
          maxPageDisplay={7}
        />
      </Row>
      <span>
        {
          `Showing ${
            this.state.offset
          } - ${
            Math.min(this.state.offset + this.state.limit, this.state.hits)
          } out of ${
            this.state.hits
          } results.`
        }
      </span>
      {
        this.state.records.map(
          record => <PackImageRecordView record={record}/>
        )
      }
      <Row>
        <PaginationBar
          hits={this.state.hits}
          offset={this.state.offset}
          handleNewOffset={this.fetch}
          pageSize={this.state.limit}
          maxPageDisplay={7}
        />
        <select
          name="pageSize"
          value={this.state.limit}
          onChange={
            event => this.setState(
              {limit: parseInt(event.target.value)},
              () => this.fetch(this.state.offset),
            )
          }
        >
          {
            Array.from(range(5, 35, 5)).map(
              v => <option value={v.toString()}>{v}</option>
            )
          }
        </select>
      </Row>
    </Col>
  }

}