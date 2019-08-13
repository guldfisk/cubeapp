import React from 'react';
import ReactDOM from 'react-dom';

import {Router, Route, Switch} from "react-router-dom";

import {connect, Provider} from 'react-redux';

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

import {LinkContainer} from 'react-router-bootstrap';

import history from './routing/history';
import {routes} from './routing/Routes';
import {loadUser} from "./auth/controller";
import {Loading} from "./utils/utils";
import SignInPage from './pages/authentication/SignInPage';
import store from './state/store';
import Breadcrumb from "react-bootstrap/Breadcrumb";


interface RootProps {
  auth: {
    token: string,
    authenticated: boolean,
    loading: symbol,
    user: any,
  }
  loadUser: () => any
}

class RootComponent extends React.Component<RootProps> {

  componentDidMount() {
    this.props.loadUser()
  }

  PrivateRoute = ({component: ChildComponent, ...rest}: any) => {
    return <Route {...rest} render={
      props => {
        if (this.props.auth.loading) {
          return <Loading/>;
        } else if (!this.props.auth.authenticated) {
          return <SignInPage/>;
        } else {
          return <ChildComponent {...props} />
        }
      }
    }/>
  };

  createRoutes = (
    routes: [string | undefined, (typeof React.Component) | React.FunctionComponent, boolean, object][]
  ) => {
    return <Switch>
      {
        routes.map(
          (
            [path, component, isPrivate, args]:
              [string | undefined, (typeof React.Component) | React.FunctionComponent, boolean, object]
          ) => {
            return (
              isPrivate ?
                <this.PrivateRoute
                  path={path}
                  component={component}
                  {...args}
                /> :
                <Route
                  path={path}
                  component={component}
                  {...args}
                />
            )
          }
        )
      }
    </Switch>
  };


  render() {
    return <Router
      history={history}
    >
      <Navbar bg='light' expand='lg' collapseOnSelect>

        <Navbar.Collapse id='basic-navbar nav'>
          <Nav className='mr-auto'>

            <LinkContainer to='/'>
              <Nav.Link>Cubes</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/search/'>
              <Nav.Link>Search</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/create-cube/'>
              <Nav.Link>Create Cube</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/patches/'>
              <Nav.Link>Patches</Nav.Link>
            </LinkContainer>

          </Nav>
          <Nav className="justify-content-end">
            {
              this.props.auth.user ?
                <Nav.Link>
                  {this.props.auth.user.username}
                </Nav.Link> : null
            }
            {
              this.props.auth.authenticated ?
                <LinkContainer to='/invite/'>
                  <Nav.Link>Invite</Nav.Link>
                </LinkContainer>
                : <LinkContainer to='/sign-up/'>
                  <Nav.Link>Sign up</Nav.Link>
                </LinkContainer>
            }
            {
              this.props.auth.authenticated ?
                <LinkContainer to='/logout/'>
                  <Nav.Link>Sign Out</Nav.Link>
                </LinkContainer>
                : <LinkContainer to='/login/'>
                  <Nav.Link>Sign In</Nav.Link>
                </LinkContainer>
            }

          </Nav>
        </Navbar.Collapse>

      </Navbar>

      {
        this.createRoutes(routes)
      }

    </Router>
  }
}


const mapStateToProps = (state: any) => {
  return {
    auth: {
      token: state.token,
      authenticated: state.authenticated,
      loading: state.loading,
      user: state.user,
    }
  }
};


const mapDispatchToProps = (dispatch: any) => {
  return {
    loadUser: () => dispatch(loadUser())
  }
};


const RootContainer = connect(mapStateToProps, mapDispatchToProps)(RootComponent);


class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <RootContainer/>
      </Provider>
    )
  }
}

const dom = document.getElementById("app");
dom ? ReactDOM.render(<App/>, dom) : null;
