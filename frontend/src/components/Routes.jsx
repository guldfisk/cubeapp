import React from "react";

import ReleasePage from './pages/ReleasePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import CreateCubePage from './pages/CreateCubePage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignOutPage from './pages/SignOutPage.jsx';
import CubesPage from './pages/CubesPage.jsx';
import CubePage from './pages/CubePage.jsx';
import DeltasPage from './pages/DeltasPage.jsx';
import DeltaPage from './pages/DeltaPage.jsx';


export const routes = [
  ['/', CubesPage, false, {exact: true}],
  ['/cube/:id(\\d+)', CubePage, false, {}],
  ['/release/:id(\\d+)', ReleasePage, false, {}],
  ['/login', SignInPage, false, {}],
  ['/logout', SignOutPage, false, {}],
  ['/create-cube', CreateCubePage, true, {}],
  ['/deltas', DeltasPage, false, {}],
  ['/delta/:id(\\d+)', DeltaPage, false, {}],
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