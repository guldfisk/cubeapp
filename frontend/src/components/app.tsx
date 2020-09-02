import React, {Suspense} from 'react';
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

import '../styling/global.css';


declare global {
  interface Window {
    __debug__: any
  }
}


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
    routes: [string | undefined, (typeof React.Component) | React.FunctionComponent, boolean, { [key: string]: any }][]
  ) => {
    return <Suspense fallback={<Loading/>}>
      <Switch>

        {
          routes.map(
            ([path, component, isPrivate, args]) => {
              return (
                isPrivate ?
                  <this.PrivateRoute
                    path={path}
                    key={path}
                    exact
                    component={component}
                    {...args}
                  /> :
                  <Route
                    path={path}
                    key={path}
                    exact
                    component={args.render ? undefined : component}
                    {...args}
                  />
              )
            }
          )
        }
      </Switch>
    </Suspense>
  };


  render() {
    return <Router
      history={history}
    >
      <Navbar bg='light' expand='lg' collapseOnSelect>

        <Navbar.Collapse id='basic-navbar nav'>
          <Nav className='mr-auto'>

            <LinkContainer to='/'>
              <Nav.Link>Home</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/cubes/'>
              <Nav.Link>Cubes</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/search/'>
              <Nav.Link>Search</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/syntax/'>
              <Nav.Link>Search Syntax</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/wishlists/'>
              <Nav.Link>Wish Lists</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/limited/'>
              <Nav.Link>Limited</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/decks/'>
              <Nav.Link>Decks</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/drafts/'>
              <Nav.Link>Drafts</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/art-game/'>
              <Nav.Link>Art Game</Nav.Link>
            </LinkContainer>

            <LinkContainer to='/about/'>
              <Nav.Link>About</Nav.Link>
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
