import React from "react";


import {CubeRelease, PackImageRecord} from "../../models/models";
import PackImageRecordView from "../../views/imgrecords/PackImageRecordView";
import {Loading} from "../../utils/utils";
import ImageDistributionGraph from "../../views/imgrecords/ImageDistributionGraph";


interface ImageRecordPageProps {
  match: any
}


interface ImageRecordPageState {
  record: PackImageRecord | null
  points: { probabilityDistributionPoints: [number, number][], cumulativePoints: [number, number][] } | null
  offset: number
  limit: number
  hits: number
}


export default class ImageRecordPage extends React.Component<ImageRecordPageProps, ImageRecordPageState> {

  constructor(props: null) {
    super(props);
    this.state = {
      points: null,
      record: null,
      offset: 0,
      limit: 5,
      hits: 0,
    };
  }

  componentDidMount() {
    PackImageRecord.get(
      this.props.match.params.id,
    ).then(
      record => this.setState(
        {record},
        () => CubeRelease.imageDistribution(
          this.state.record.release.id,
          this.state.record.pick.totalPickables(),
        ).then(
          points => this.setState({points})
        )
      ),
    );
  }

  render() {
    return <>
      {
        this.state.record ?
          <PackImageRecordView record={this.state.record}/>
          : <Loading/>
      }
      {
        this.state.points && <ImageDistributionGraph
          probabilities={this.state.points}
          highlightImageQuantity={this.state.record.imageAmount}
        />
      }
    </>
  }

}