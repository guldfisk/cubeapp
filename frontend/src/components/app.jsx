import React from 'react';
import ReactDOM from 'react-dom';

import {BrowserRouter as Router, Route, Switch} from "react-router-dom";

import {applyMiddleware, createStore} from "redux";

import {connect, Provider} from 'react-redux';

import thunk from "redux-thunk";

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

import {LinkContainer} from 'react-router-bootstrap';

import {routes} from './Routes.jsx';
import authReducer from './state/reducers';
import {loadUser} from "./auth/controller";
import {Loading} from "./utils.jsx";
import SignInPage from './pages/SignInPage.jsx';


const store = createStore(authReducer, applyMiddleware(thunk));


class RootComponent extends React.Component {

  componentDidMount() {
    this.props.loadUser()
  }

  PrivateRoute = ({component: ChildComponent, ...rest}) => {
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

  createRoutes = (routes) => {
    return <Switch>
      {
        routes.map(
          ([path, component, isPrivate, args]) => {
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
    return <Router>
    <Navbar bg='light' expand='lg' fluid='true' collapseOnSelect>

      <Navbar.Collapse id='basic-navbar nav'>
        <Nav className='mr-auto'>

          <LinkContainer to='/'>
            <Nav.Link>Home</Nav.Link>
          </LinkContainer>

          <LinkContainer to='/search/'>
            <Nav.Link>Search</Nav.Link>
          </LinkContainer>

          <LinkContainer to='/create-cube/'>
            <Nav.Link>Create Cube</Nav.Link>
          </LinkContainer>

        </Nav>
        <Nav className="justify-content-end">
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

const mapStateToProps = (state) => {
  return {
    auth: {
      token: state.token,
      authenticated: state.authenticated,
      loading: state.loading,
      user: state.user,
    }
  }
};


const mapDispatchToProps = (dispatch) => {
  return {
    loadUser: () => dispatch(loadUser())
  }
};


const RootContainer = connect(mapStateToProps, mapDispatchToProps)(RootComponent);


class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <RootContainer />
      </Provider>
    )
  }
}

const dom = document.getElementById("app");
dom ? ReactDOM.render(<App/>, dom) : null;
