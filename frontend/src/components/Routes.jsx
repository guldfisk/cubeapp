import React from "react";

import CubesPage from './pages/CubesPage.jsx';
import CubeViewPage from './pages/CubeViewPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import CreateCubePage from './pages/CreateCubePage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignOutPage from './pages/SignOutPage.jsx';


export const routes = [
  ['/', CubesPage, false, {exact: true}],
  ['/cubeview/:cubeId(\\d+)', CubeViewPage, false, {}],
  ['/login', SignInPage, false, {}],
  ['/logout', SignOutPage, false, {}],
  ['/create-cube', CreateCubePage, true, {}],
  [null, NotFoundPage, false, {}],
];

// export default () => <Switch>
//   <Route path="/" exact component={CubesPage}/>
//   <Route path="/cubeview/:cubeId(\d+)" component={CubeViewPage}/>
//   {/*<Route path='/search/:initialSearch?' component={SearchPage}/>*/}
//   <Route path="/login" component={SignInPage}/>
//   <Route path="/logout" component={SignOutPage}/>
//   <PrivateRoute path="/create_cube" component={CreateCubePage}/>
//   <Route component={NotFoundPage}/>
// </Switch>