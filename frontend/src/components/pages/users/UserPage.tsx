import React, {RefObject} from 'react';

import {FullDeck, FullScheduledMatch, FullUser, ScheduledMatch, Tournament} from '../../models/models';
import {Loading} from "../../utils/utils";
import TournamentView from "../../views/tournaments/TournamentView";
import DeckView from "../../views/limited/decks/DeckView";
import {UserView} from "../../views/users/UserView";
import Paginator from "../../utils/Paginator";
import MatchView from "../../views/tournaments/MatchView";
import {FullMatchView} from "../../views/tournaments/FullMatchView";


interface UserPageProps {
  match: any
}

interface UserPageState {
  user: FullUser | null;
  // decks: FullDeck[];
}


export default class UserPage extends React.Component<UserPageProps, UserPageState> {
  paginatorRef: RefObject<Paginator<FullScheduledMatch>>;

  constructor(props: UserPageProps) {
    super(props);
    this.paginatorRef = React.createRef();
    this.state = {
      user: null,
      // decks: [],
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
