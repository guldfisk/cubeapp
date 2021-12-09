import React, {RefObject} from 'react';

import Paginator from "../../utils/Paginator";
import UserView from "../../views/users/UserView";
import {FullMatchView} from "../../views/tournaments/FullMatchView";
import {FullScheduledMatch, FullUser, PaginatedResponse} from '../../models/models';
import {Loading} from "../../utils/utils";


interface UserPageProps {
  match: any
}

interface UserPageState {
  user: FullUser | null;
}


export default class UserPage extends React.Component<UserPageProps, UserPageState> {
  paginatorRef: RefObject<Paginator<FullScheduledMatch, PaginatedResponse<FullScheduledMatch>>>;

  constructor(props: UserPageProps) {
    super(props);
    this.paginatorRef = React.createRef();
    this.state = {
      user: null,
    };
  }

  componentDidMount() {
    this.refresh();
  }

  refresh = (): void => {
    FullUser.get(this.props.match.params.id).then(
      user => {
        this.setState(
          {user},
        );
      }
    );
  };

  render() {
    let userView = <Loading/>;
    if (this.state.user !== null) {
      userView = <UserView user={this.state.user}/>
    }
    return <>
      {userView}
      <h3>Scheduled Matches</h3>
      <Paginator
        fetch={
          ((offset, limit) => FullScheduledMatch.forUser(this.props.match.params.id, offset, limit))
        }
        renderBody={
          (items: FullScheduledMatch[]) => items.map(
            item => <FullMatchView
              match={item}
              handleSubmitted={() => this.paginatorRef.current.refresh()}
            />
          )
        }
        ref={this.paginatorRef}
      />
    </>;
  }
}
