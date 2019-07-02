// import 'react-table/react-table.css'

import React from 'react';
import ReactDOM from 'react-dom';

import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import {applyMiddleware, createStore} from "redux";

import {connect, Provider} from 'react-redux';

import thunk from "redux-thunk";

import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

import {LinkContainer} from 'react-router-bootstrap';

import Routes from './Routes.jsx';
import authReducer from './state/reducers';


const store = createStore(authReducer, applyMiddleware(thunk));


class RootComponent extends React.Component {

  componentDidMount() {
    this.props.loadUser()
  }

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

          <LinkContainer to='/create_cube/'>
            <Nav.Link>Create Cube</Nav.Link>
          </LinkContainer>

        </Nav>
        <Nav className="justify-content-end">

          <LinkContainer to='/login/'>
            <Nav.Link>Sign In</Nav.Link>
          </LinkContainer>

        </Nav>
      </Navbar.Collapse>

    </Navbar>

    <Container
      fluid={true}
    >
      <Routes/>
    </Container>

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
    loadUser: () => dispatch(auth.loadUser())
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
