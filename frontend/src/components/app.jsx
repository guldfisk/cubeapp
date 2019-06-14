import React from 'react';
import ReactDOM from 'react-dom';
import 'react-table/react-table.css'
import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import CubesPage from './CubesPage.jsx';
import CubeViewPage from './CubeViewPage.jsx';

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
          </ul>
        </nav>

        <Route path="/" exact component={CubesPage}/>
        <Route path="/cubeview/:cubeId(\d+)" component={CubeViewPage}/>
      </div>
    </Router>
  )
};


const dom = document.getElementById("app");
dom ? ReactDOM.render(<AppRouter/>, dom) : null;
