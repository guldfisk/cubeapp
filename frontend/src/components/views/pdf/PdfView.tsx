import React, {Component} from 'react';
import Button from "react-bootstrap/Button";


interface PdfViewProps {
  url: string
  downloadable?: boolean
}



export default class PdfView extends Component<PdfViewProps> {

  render() {
    return <a
      href={this.props.url}
      title="Download pdf"
      download="distribution.pdf"
    >
      <Button>
        Download
      </Button>
    </a>;
  }
}