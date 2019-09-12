import React, {Component} from 'react';
import {Document, Page, pdfjs} from 'react-pdf';
import PaginationBar from "../utils/PaginationBar";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;


interface TestPageState {
  numPages: number
  pageNumber: number
}

export default class TestPage extends Component<null, TestPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      numPages: 1,
      pageNumber: 1,
    };
  }

  onDocumentLoadSuccess = ({numPages}: { numPages: number }) => {
    this.setState({numPages});
  };

  render() {
    return (
      <div>
        <Document
          file="https://phdk.fra1.digitaloceanspaces.com/phdk/distributions/distribution.pdf"
          onLoadSuccess={this.onDocumentLoadSuccess}
        >
          <Page pageNumber={this.state.pageNumber}/>
        </Document>
        <PaginationBar
          hits={this.state.numPages}
          offset={this.state.pageNumber - 1}
          handleNewOffset={offset => {this.setState({pageNumber: offset + 1})}}
          pageSize={1}
          maxPageDisplay={7}
        />
      </div>
    );
  }
}