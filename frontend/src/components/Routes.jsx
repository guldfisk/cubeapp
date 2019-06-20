import React from "react";

import {Route, Switch} from "react-router-dom";

import CubesPage from './pages/CubesPage.jsx';
import CubeViewPage from './pages/CubeViewPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';


export default () => <Switch>
  <Route path="/" exact component={CubesPage}/>
  <Route path="/cubeview/:cubeId(\d+)" component={CubeViewPage}/>
  <Route path='/search/:initialSearch?' component={SearchPage}/>
  <Route component={NotFoundPage}/>
</Switch>