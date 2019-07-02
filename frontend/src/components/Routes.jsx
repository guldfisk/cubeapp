import React from "react";

import {Redirect} from "react-router";
import {Route, Switch} from "react-router-dom";

import CubesPage from './pages/CubesPage.jsx';
import CubeViewPage from './pages/CubeViewPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import CreateCubePage from './pages/CreateCubePage.jsx';
import SignInPage from './pages/SignInPage.jsx';


const PrivateRoute = ( {component: ChildComponent, ...rest} ) => {
  return <Route {...rest} render={
    props => {
      if (this.props.auth.loading) {
        return <em>Loading...</em>;
      } else if (!this.props.auth.authenticated) {
        return <Redirect to="/login"/>;
      } else {
        return <ChildComponent {...props} />
      }
    }
  }/>
};


export default () => <Switch>
  <Route path="/" exact component={CubesPage}/>
  <Route path="/cubeview/:cubeId(\d+)" component={CubeViewPage}/>
  {/*<Route path='/search/:initialSearch?' component={SearchPage}/>*/}
  <Route path="/login" component={SignInPage}/>
  <Route path="/create_cube" component={CreateCubePage}/>
  <Route component={NotFoundPage}/>
</Switch>