import React from "react";

import ReleasePage from './pages/ReleasePage';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';
import CreateCubePage from './pages/CreateCubePage';
import SignInPage from './pages/SignInPage';
import SignOutPage from './pages/SignOutPage';
import CubesPage from './pages/CubesPage';
import CubePage from './pages/CubePage';
import DeltasPage from './pages/DeltasPage';
import DeltaPage from './pages/DeltaPage';


export const routes: [string | undefined, (typeof React.Component) | React.FunctionComponent, boolean, object][] = [
  ['/', CubesPage, false, {exact: true}],
  ['/cube/:id(\\d+)', CubePage, false, {}],
  ['/release/:id(\\d+)', ReleasePage, false, {}],
  ['/login', SignInPage, false, {}],
  ['/logout', SignOutPage, false, {}],
  ['/create-cube', CreateCubePage, true, {}],
  ['/deltas', DeltasPage, false, {}],
  ['/delta/:id(\\d+)', DeltaPage, false, {}],
  [undefined, NotFoundPage, false, {}],
];
