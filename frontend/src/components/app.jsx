import Bootstrap from 'bootstrap/dist/css/bootstrap.min.css';
import 'react-table/react-table.css'

import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavItem from 'react-bootstrap/NavItem';

import {LinkContainer} from 'react-router-bootstrap';

import Routes from './Routes.jsx';


const AppRouter = () => {
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
        </Nav>
      </Navbar.Collapse>
    </Navbar>
    <Container
      fluid={true}
    >
      <Routes/>
    </Container>
  </Router>
};


const dom = document.getElementById("app");
dom ? ReactDOM.render(<AppRouter/>, dom) : null;
