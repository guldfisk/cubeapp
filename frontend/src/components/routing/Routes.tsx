import React from "react";

import ReleasePage from '../pages/ReleasePage';
import NotFoundPage from '../pages/NotFoundPage';
import CreateCubePage from '../pages/CreateCubePage';
import CubePatchesPage from '../pages/patches/CubePatchesPage';
import SignInPage from '../pages/authentication/SignInPage';
import SignOutPage from '../pages/authentication/SignOutPage';
import CubesPage from '../pages/CubesPage';
import CubePage from '../pages/CubePage';
import PatchesPage from '../pages/patches/PatchesPage';
import PatchPage from '../pages/patches/PatchPage';
import CreatePatchPage from '../pages/patches/CreatePatchPage';
import SignUpPage from "../pages/authentication/SignUpPage";
import InvitePage from "../pages/authentication/InvitePage";
import ApplyPatchPage from "../pages/patches/ApplyPatchPage";
import AboutPage from "../pages/AboutPage";
import ReleaseComparePage from "../pages/ReleaseComparePage";
import LatestReleasePage from "../pages/LatestReleasePage";
import SearchSyntaxPage from "../pages/SearchSyntaxPage";
import SearchPage from "../pages/SearchPage";

export const routes: [
  string | undefined,
  (typeof React.Component) | React.FunctionComponent,
  boolean,
  { [key: string]: any }
][] = [
  ['/', CubesPage, false, {exact: true}],
  ['/cube/:id(\\d+)/patches/create', CreatePatchPage, true, {}],
  ['/cube/:id(\\d+)/patches', CubePatchesPage, false, {}],
  ['/cube/:id(\\d+)/latest-release', LatestReleasePage, false, {}],
  ['/cube/:id(\\d+)', CubePage, false, {}],
  ['/release/:id(\\d+)/delta-from/:id_from(\\d+)', ReleaseComparePage, false, {}],
  ['/release/:id(\\d+)', ReleasePage, false, {}],
  ['/login', SignInPage, false, {}],
  ['/invite', InvitePage, true, {}],
  ['/logout', SignOutPage, false, {}],
  ['/sign-up', SignUpPage, false, {}],
  ['/create-cube', CreateCubePage, true, {}],
  ['/patches', PatchesPage, false, {}],
  ['/syntax', SearchSyntaxPage, false, {}],
  ['/search', SearchPage, false, {}],
  ['/patch/:id(\\d+)/apply', ApplyPatchPage, true, {}],
  [
    '/patch/:id(\\d+)', PatchPage, false,
    {
      render: (
        (props: any) => <PatchPage {...props} key={props.match.params.id}/>
      )
    }
  ],
  ['/about', AboutPage, false, {}],
  [undefined, NotFoundPage, false, {}],
];
