import React, {RefObject} from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, {textFilter, numberFilter} from 'react-bootstrap-table2-filter';
import cellEditFactory from 'react-bootstrap-table2-editor';

import {
  Cardboard,
  CardboardWish, IsAltered,
  IsBorder, IsFoil,
  IsLanguage,
  IsMinimumCondition, IsSigned,
  Requirement,
  Wish,
  WishList
} from '../../models/models';
import WishView from "./WishView";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import {Modal} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import {CardboardSearchView} from "../search/SearchView";


interface RequirementCreatorProps {
  onRequirementCreated: (requirement: Requirement) => void
}


interface IsBorderState {
  border: string
}


class IsBorderCreator extends React.Component<RequirementCreatorProps, IsBorderState> {

  constructor(props: RequirementCreatorProps) {
    super(props);
    this.state = {
      border: 'BLACK',
    };
  }

  render() {
    return <>
      <select
        value={this.state.border}
        onChange={(event: any) => this.setState({border: event.target.value})}
      >
        <option value='BLACK'>black</option>
        <option value='WHITE'>white</option>
        <option value='SILVER'>silver</option>
        <option value='GOLD'>gold</option>
      </select>
      <Button
        onClick={
          () => {
            this.props.onRequirementCreated(
              new IsBorder(null, null, null, this.state.border)
            )
          }
        }
      >
        add
      </Button>
    </>
  }

}


interface IsMinimumConditionState {
  condition: string
}


class IsMinimumConditionCreator extends React.Component<RequirementCreatorProps, IsMinimumConditionState> {

  constructor(props: RequirementCreatorProps) {
    super(props);
    this.state = {
      condition: 'GOOD',
    };
  }

  render() {
    return <>
      <select
        value={this.state.condition}
        onChange={(event: any) => this.setState({condition: event.target.value})}
      >
        <option value='MINT'>mint</option>
        <option value='NEAR_MINT'>near mint</option>
        <option value='EXCELLENT'>excellent</option>
        <option value='GOOD'>good</option>
        <option value='LIGHT_PLAYED'>light player</option>
        <option value='PLAYED'>played</option>
        <option value='POOR'>poor</option>
      </select>
      <Button
        onClick={
          () => {
            this.props.onRequirementCreated(
              new IsMinimumCondition(null, null, null, this.state.condition)
            )
          }
        }
      >
        add
      </Button>
    </>
  }

}


interface RequirementSelectorProps {
  onRequirementSelected: (requirement: Requirement) => void
}


interface RequirementSelectorState {
  requirementType: string,
  value: string,
}


class RequirementSelector extends React.Component<RequirementSelectorProps, RequirementSelectorState> {

  constructor(props: RequirementSelectorProps) {
    super(props);
    this.state = {
      requirementType: 'IsBorder',
      value: 'BLACK',
    }
  }

  onRequirementTypeChange = (event: any): void => {
    const defaultValueMap: { [key: string]: string } = {
      IsBorder: 'BLACK',
      IsMinimumCondition: 'GOOD',
    };

    this.setState(
      {
        requirementType: event.target.value,
        value: defaultValueMap[event.target.value],
      }
    )
  };

  onValueChange = (event: any): void => {
    this.setState({value: event.target.value})
  };

  render() {
    let requriementCreator = <div/>;

    switch (this.state.requirementType) {
      case 'IsBorder':
        requriementCreator = <IsBorderCreator onRequirementCreated={this.props.onRequirementSelected}/>;
        break;

      case 'IsMinimumCondition':
        requriementCreator = <IsMinimumConditionCreator onRequirementCreated={this.props.onRequirementSelected}/>;
        break;

    }

    return <>
      <select
        value={this.state.requirementType}
        onChange={this.onRequirementTypeChange}
      >
        <option value='IsBorder'>is border</option>
        <option value='IsMinimumCondition'>is minimum condition</option>
      </select>
      {requriementCreator}
    </>
  }

}


interface RequirementListProps {
  initialRequirements: Requirement[]
}


interface RequirementListState {
  requirements: Requirement[]
  idCounter: number
}


class RequirementList extends React.Component<RequirementListProps, RequirementListState> {

  constructor(props: RequirementListProps) {
    super(props);
    let id = 0;
    this.state = {
      requirements: this.props.initialRequirements.map(
        requirement => {
          id = id + 1;
          requirement.id = id.toString();
          return requirement;
        }
      ),
      idCounter: this.props.initialRequirements.length,
    };
  }

  getRequirements = (): Requirement[] => {
    return this.state.requirements
  };

  deleteRequirement = (id: string): void => {
    this.setState(
      {
        requirements: this.state.requirements.filter(
          requirement => requirement.id != id
        )
      }
    )
  };

  addRequirement = (requirement: Requirement): void => {
    requirement.id = (this.state.idCounter + 1).toString();
    this.setState(
      {
        requirements: this.state.requirements.concat(
          [requirement]
        ),
        idCounter: this.state.idCounter + 1,
      }
    )
  };

  render() {

    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'name',
        text: 'Type',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        },
      },
      {
        dataField: 'value',
        text: 'Value',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        },
      },
      {
        dataField: 'delete',
        text: '',
        isDummyField: true,
        editable: false,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <i
          className="fa fa-times-circle"
          onClick={() => this.deleteRequirement(row.id)}
        />,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5em', textAlign: 'center'};
        },
      },
    ];
    return <>
      <RequirementSelector
        onRequirementSelected={this.addRequirement}
      />
      <BootstrapTable
        keyField='id'
        data={
          this.state.requirements.map(
            requirement => {
              return {
                id: requirement.id,
                name: requirement.name(),
                value: requirement.value(),
              }
            }
          )
        }
        columns={columns}
        bootstrap4
        condensed
      />
    </>
  }

}


interface WishCreatorProps {
  onWishCreated: (weight: number, cardboard: Cardboard, requirements: Requirement[]) => void
  cancel: () => void
  show: boolean
}


interface WishCreatorState {
  cardboard: Cardboard | null
  weight: number
}


class WishCreator extends React.Component<WishCreatorProps, WishCreatorState> {
  requirementListRef: RefObject<RequirementList>;

  constructor(props: WishCreatorProps) {
    super(props);
    this.requirementListRef = React.createRef();
    this.state = {
      cardboard: null,
      weight: 1,
    }
  }

  submit = (): void => {
    if (this.state.cardboard !== null) {
      this.props.onWishCreated(
        this.state.weight,
        this.state.cardboard,
        this.requirementListRef.current.getRequirements(),
      )
    }
  };

  render() {
    return <Modal
      show={this.props.show}
    >
      <Modal.Header closeButton>
        <Modal.Title>Make a wish</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            <Col>
              <label>
                {this.state.cardboard === null ? "no cardboard selected" : this.state.cardboard.name}
              </label>
            </Col>
            <Col>
              <input
                type="number"
                value={this.state.weight}
                onChange={(event: any) => this.setState({weight: parseInt(event.target.value)})}
              />
            </Col>
          </Row>
          <Row>
            <RequirementList
              initialRequirements={
                [
                  new IsLanguage(null, null, null, 'ENGLISH'),
                  new IsFoil(null, null, null, 'false'),
                  new IsAltered(null, null, null, 'false'),
                  new IsSigned(null, null, null, 'false'),
                ]
              }
              ref={this.requirementListRef}
            />
          </Row>
          <Row>
            <CardboardSearchView
              handleCubeableClicked={
                cardboard => this.setState({cardboard})
              }
              limit={3}
            />
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => this.props.cancel()}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => this.submit()}
          disabled={this.state.cardboard === null}
        >
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  }

}


interface WishListViewProps {
  wishlist: WishList;
}


interface WishListViewState {
  page: number
  pageSize: number
  wishes: Wish[]
  hits: number
  filters: { [key: string]: string }
  sortField: string
  sortAscending: boolean
  cardboardFilterSyntaxCorrect: boolean
  creatingNewWish: boolean
}


export default class WishListView extends React.Component<WishListViewProps, WishListViewState> {

  constructor(props: WishListViewProps) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 10,
      wishes: [],
      hits: 0,
      filters: {},
      sortField: 'weight',
      sortAscending: false,
      cardboardFilterSyntaxCorrect: true,
      creatingNewWish: false,
    }
  }

  componentDidMount(): void {
    this.loadWishes();
  }

  loadWishes = (): void => {
    this.props.wishlist.getWishes(
      (this.state.page - 1) * this.state.pageSize,
      this.state.pageSize,
      this.state.sortField,
      this.state.sortAscending,
      this.state.filters,
    ).then(
      paginatedResponse => this.setState(
        {
          wishes: paginatedResponse.objects,
          hits: paginatedResponse.hits,
        }
      )
    )
  };

  handleTableChanged = (
    type: string,
    {page, sizePerPage, filters, sortField, sortOrder, data, cellEdit}:
      {
        page: number,
        sizePerPage: number,
        filters: any,
        sortField: string,
        sortOrder: string,
        data: any,
        cellEdit: any,
      },
  ) => {
    if (type == 'filter') {
      const _filters: { [key: string]: string } = {};
      if (filters.cardboards) {
        _filters.cardboard_filter = filters.cardboards.filterVal;
      }
      if (filters.weight) {
        _filters.weight_filter = filters.weight.filterVal.number;
        _filters.weight_filter_comparator = filters.weight.filterVal.comparator;
      }
      this.props.wishlist.getWishes(
        (this.state.page - 1) * this.state.pageSize,
        this.state.pageSize,
        this.state.sortField,
        this.state.sortAscending,
        _filters,
      ).then(
        paginatedResponse => this.setState(
          {
            filters: _filters,
            wishes: paginatedResponse.objects,
            hits: paginatedResponse.hits,
            cardboardFilterSyntaxCorrect: true,
          }
        )
      ).catch(
        error => this.setState(
          {
            cardboardFilterSyntaxCorrect: false,
          }
        )
      )
    } else if (type == 'pagination') {
      this.props.wishlist.getWishes(
        (page - 1) * sizePerPage,
        sizePerPage,
        this.state.sortField,
        this.state.sortAscending,
        this.state.filters,
      ).then(
        paginatedResponse => this.setState(
          {
            page,
            pageSize: sizePerPage,
            wishes: paginatedResponse.objects,
            hits: paginatedResponse.hits,
          }
        )
      )
    } else if (type == 'sort') {
      const sortFieldMap: { [key: string]: string } = {
        cardboards: 'cardboards',
        weight: 'weight',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      };
      const mappedSortField = sortFieldMap[sortField];
      const sortAscending = sortOrder == 'asc';
      this.props.wishlist.getWishes(
        (this.state.page - 1) * this.state.pageSize,
        this.state.pageSize,
        mappedSortField,
        sortAscending,
        this.state.filters,
      ).then(
        paginatedResponse => this.setState(
          {
            sortField: mappedSortField,
            sortAscending,
            wishes: paginatedResponse.objects,
            hits: paginatedResponse.hits,
          }
        )
      )
    } else if (type == 'cellEdit') {
      if (cellEdit.dataField == 'weight') {
        Wish.update(cellEdit.rowId.toString(), {'weight': cellEdit.newValue}).then(
          wish => this.loadWishes()
        )
      }
    }
  };

  render() {

    const columns = [
      {
        dataField: 'id',
        text: 'ID',
        hidden: true,
      },
      {
        dataField: 'cardboards',
        text: 'Cardboards',
        filter: textFilter(
          {
            style: {
              color: this.state.cardboardFilterSyntaxCorrect ? 'black' : 'red',
            }
          }
        ),
        sort: true,
        editable: false,
      },
      {
        dataField: 'weight',
        text: 'Weight',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        },
        filter: numberFilter(),
        sort: true,
      },
      {
        dataField: 'createdAt',
        text: 'Created At',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        },
        sort: true,
        editable: false,
      },
      {
        dataField: 'updatedAt',
        text: 'Updated At',
        headerStyle: (column: any, colIndex: number) => {
          return {width: '12em', textAlign: 'center'};
        },
        sort: true,
        editable: false,
      },
      {
        dataField: 'delete',
        text: '',
        isDummyField: true,
        editable: false,
        formatter: (cell: any, row: any, rowIndex: number, formatExtraData: any) => <>
          <i
            className="fa fa-plus-circle"
            onClick={() => null}
          />
          <i
            className="fa fa-times-circle"
            onClick={() => row.wish.delete().then(this.loadWishes)}
          />
        </>,
        headerStyle: (column: any, colIndex: number) => {
          return {width: '5em', textAlign: 'center'};
        },
      },
    ];

    const data = this.state.wishes.map(
      wish => {
        return {
          id: wish.id,
          weight: wish.weight,
          createdAt: wish.createdAt,
          updatedAt: wish.updatedAt,
          cardboards: <WishView
            wish={wish}
            onCardboardWishMinimumAmountChange={
              (cardboardWish: CardboardWish, minimumAmount: number) => {
                CardboardWish.update(
                  cardboardWish.id,
                  {
                    minimum_amount: minimumAmount.toString(),
                  },
                ).then(
                  () => this.loadWishes()
                )
              }
            }
            onCardboardWishDelete={
              cardboardWish => {
                CardboardWish.delete(cardboardWish.id).then(
                  () => this.loadWishes()
                )
              }
            }
            onRequirementDelete={
              requirement => {
                Requirement.delete(requirement.id).then(
                  () => this.loadWishes()
                )
              }
            }
          />,
          wish: wish,
        }
      }
    );

    return <>
      <WishCreator
        show={this.state.creatingNewWish}
        onWishCreated={
          (weight: number, cardboard: Cardboard, requirements: Requirement[]) => {
            console.log(weight);
            console.log(cardboard);
            console.log(requirements);
            this.setState({creatingNewWish: false});
            this.props.wishlist.createWish(
              weight,
              cardboard,
              requirements,
            ).then(
              () => this.loadWishes()
            )
          }
        }
        cancel={
          () => this.setState({creatingNewWish: false})
        }
      />
      <Container fluid>
        <Row>
          <Col sm={2}>
            <Card>
              <Card.Header>
                Actions
              </Card.Header>
              <Card.Body>
                <a
                  onClick={() => this.setState({creatingNewWish: true})}
                >
                  Add wish
                </a>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <BootstrapTable
              remote
              keyField='id'
              data={data}
              columns={columns}
              bootstrap4
              condensed
              filter={filterFactory()}
              pagination={
                paginationFactory(
                  {
                    hidePageListOnlyOnePage: true,
                    showTotal: true,
                    page: this.state.page,
                    sizePerPage: this.state.pageSize,
                    totalSize: this.state.hits,
                  }
                )
              }
              cellEdit={
                cellEditFactory(
                  {
                    mode: 'click',
                    blurToSave: true,
                  }
                )
              }
              onTableChange={this.handleTableChanged}
            />
          </Col>
        </Row>
      </Container>
    </>
  }

}
