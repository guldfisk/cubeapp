import React from 'react';

import queryString from "query-string";
import {string} from "prop-types";
import Button from "react-bootstrap/Button";
import {createSession, getRefreshRedirect} from "../../services/kpd";


interface UpdateTokenPageProps {
  match: any
  location: any
}


interface UpdateTokenPageState {
  code: string | null
  loading: boolean
  loadingSession: boolean
  success: boolean
  validUntil: string
}


export default class UpdateTokenPage extends React.Component<UpdateTokenPageProps, UpdateTokenPageState> {

  constructor(props: UpdateTokenPageProps) {
    super(props);
    this.state = {
      code: null,
      loading: false,
      loadingSession: false,
      success: false,
      validUntil: '',
    };
  }

  componentDidMount() {
    const queryOptions = queryString.parse(this.props.location.search);
    if (queryOptions.code && typeof queryOptions.code === 'string') {
      this.setState(
        {code: queryOptions.code as string, loadingSession: true},
        () => createSession(this.state.code).then(
          validUntil => this.setState({validUntil, loadingSession: false, success: true})
        ).catch(
          () => this.setState({loadingSession: false})
        )
      )
    }
  }

  render() {
    return <>
      {
        this.state.code && <h4>
          {
            (
              this.state.loadingSession ? 'Updating session...' : (
                this.state.success ? 'Session updated. Valid until ' + this.state.validUntil
                  : 'Failed updating session :('
              )
            )
          }
        </h4>
      }
      <Button
        disabled={this.state.loading}
        onClick={
          () => this.setState(
            {loading: true},
            () => getRefreshRedirect().then(
              url => window.location.href = url
            ).catch(() => this.setState({loading: false}))
          )
        }
      >
        Update session token
      </Button>
    </>
  }

}