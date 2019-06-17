import React from 'react';
import ReactDOM from 'react-dom';
import 'react-table/react-table.css'
import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import CubesPage from './CubesPage.jsx';
import CubeViewPage from './CubeViewPage.jsx';
import SearchPage from './SearchPage.jsx';

import Bootstrap from 'bootstrap/dist/css/bootstrap.min.css';


const AppRouter = () => {
  return (
    <Router>

      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/search/">Search</Link>
            </li>
          </ul>
        </nav>

        <Route path="/" exact component={CubesPage} />
        <Route path="/cubeview/:cubeId(\d+)" component={CubeViewPage} />
        <Route path='/search/:initialSearch?' component={SearchPage} />
      </div>
    </Router>
  )
};


const dom = document.getElementById("app");
dom ? ReactDOM.render(<AppRouter/>, dom) : null;
