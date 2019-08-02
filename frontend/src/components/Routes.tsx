import React from "react";

import ReleasePage from './pages/ReleasePage';
import NotFoundPage from './pages/NotFoundPage';
import CreateCubePage from './pages/CreateCubePage';
import CubePatchesPage from './pages/CubePatchesPage';
import SignInPage from './pages/SignInPage';
import SignOutPage from './pages/SignOutPage';
import CubesPage from './pages/CubesPage';
import CubePage from './pages/CubePage';
import PatchesPage from './pages/PatchesPage';
import PatchPage from './pages/PatchPage';


export const routes: [string | undefined, (typeof React.Component) | React.FunctionComponent, boolean, object][] = [
  ['/', CubesPage, false, {exact: true}],
  ['/cube/:id(\\d+)/deltas', CubePatchesPage, false, {}],
  ['/cube/:id(\\d+)', CubePage, false, {}],
  ['/release/:id(\\d+)', ReleasePage, false, {}],
  ['/login', SignInPage, false, {}],
  ['/logout', SignOutPage, false, {}],
  ['/create-cube', CreateCubePage, true, {}],
  ['/deltas', PatchesPage, false, {}],
  ['/delta/:id(\\d+)', PatchPage, false, {}],
  [undefined, NotFoundPage, false, {}],
];
