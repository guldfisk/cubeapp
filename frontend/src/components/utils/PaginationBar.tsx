import React from 'react';
import Pagination from 'react-bootstrap/Pagination';

import '../../styling/PaginationBar.css'


interface PaginationBarProps {
  hits: number,
  offset: number,
  handleNewOffset: (offset: number) => void
  pageSize: number,
  maxPageDisplay: number,
}


export default class PaginationBar extends React.Component<PaginationBarProps> {

  createPage = (index: number, currentPage: number): React.ReactElement<any, string | React.JSXElementConstructor<any>> => {
    return <Pagination.Item
      disabled={index === currentPage}
      onClick={
        () =>
          this.props.handleNewOffset(
            index * this.props.pageSize
          )
      }
    >
      {index}
    </Pagination.Item>
  };

  render(): React.ReactElement<any, string | React.JSXElementConstructor<any>> {
    const pageAmount: number = Math.ceil(this.props.hits / this.props.pageSize);
    const currentPage: number = Math.ceil(this.props.offset / this.props.pageSize);

    let pages: any[] = [];

    if (pageAmount > this.props.maxPageDisplay) {

      let pageOffset = Math.max(0, currentPage - Math.floor(this.props.maxPageDisplay / 2));
      let lastPageMinified = pageOffset + this.props.maxPageDisplay;

      if (lastPageMinified > pageAmount) {
        pageOffset -= lastPageMinified - pageAmount;
        lastPageMinified = pageAmount;
      }

      if (pageOffset > 0) {
        pages.push(
          this.createPage(0, currentPage)
        );
      }

      const targetLastPage = lastPageMinified - pages.length - (lastPageMinified < pageAmount ? 1 : 0);

      for (let i = pageOffset; i < targetLastPage; i++) {
        pages.push(
          this.createPage(i, currentPage)
        );
      }

      if (lastPageMinified < pageAmount) {
        pages.push(
          this.createPage(pageAmount - 1, currentPage)
        );
      }

    } else {
      for (let i = 0; i < pageAmount; i++) {
        pages.push(
          this.createPage(i, currentPage)
        )
      }
    }

    return <Pagination>
      <Pagination.Prev
        onClick={
          () =>
            this.props.handleNewOffset(
              Math.max(
                0,
                this.props.offset - this.props.pageSize
              )
            )
        }
        disabled={this.props.offset === 0}
        className='pagination-navigation-item'
      />
      {pages}
      <Pagination.Next
        onClick={
          () =>
            this.props.handleNewOffset(
              Math.max(
                this.props.offset + this.props.pageSize,
                0,
              )
            )
        }
        disabled={this.props.offset + this.props.pageSize >= this.props.hits}
        className='pagination-navigation-item'
      />
    </Pagination>
  }

}