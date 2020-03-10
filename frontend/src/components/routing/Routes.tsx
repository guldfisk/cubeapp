import React from "react";

import ReleasePage from '../pages/release/ReleasePage';
import NotFoundPage from '../pages/NotFoundPage';
import CreateCubePage from '../pages/cubes/CreateCubePage';
import CubePatchesPage from '../pages/patches/CubePatchesPage';
import SignInPage from '../pages/authentication/SignInPage';
import SignOutPage from '../pages/authentication/SignOutPage';
import CubesPage from '../pages/cubes/CubesPage';
import CubePage from '../pages/cubes/CubePage';
import PatchesPage from '../pages/patches/PatchesPage';
import PatchPage from '../pages/patches/PatchPage';
import CreatePatchPage from '../pages/patches/CreatePatchPage';
import SignUpPage from "../pages/authentication/SignUpPage";
import InvitePage from "../pages/authentication/InvitePage";
import ApplyPatchPage from "../pages/patches/ApplyPatchPage";
import AboutPage from "../pages/AboutPage";
import ReleaseComparePage from "../pages/release/ReleaseComparePage";
import LatestReleasePage from "../pages/release/LatestReleasePage";
import SearchSyntaxPage from "../pages/search/SearchSyntaxPage";
import SearchPage from "../pages/search/SearchPage";
import SamplePackPage from "../pages/SamplePackPage";
import WishListPage from "../pages/wishes/WishListPage";
import WishListsPage from "../pages/wishes/WishListsPage";
// import PoolsPage from "../pages/sealed/PoolsPage";
import PoolPage from "../pages/limited/PoolPage";
import SessionsPage from "../pages/limited/SessionsPage";
import SessionPage from "../pages/limited/SessionPage";
import ArtGamePage from "../pages/ArtGamePage";


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
  ['/release/:id(\\d+)/sample-pack/', SamplePackPage, false, {}],
  ['/release/:id(\\d+)', ReleasePage, false, {}],
  ['/login', SignInPage, false, {}],
  ['/invite', InvitePage, true, {}],
  ['/logout', SignOutPage, false, {}],
  ['/sign-up', SignUpPage, false, {}],
  ['/create-cube', CreateCubePage, true, {}],
  ['/patches', PatchesPage, false, {}],
  ['/syntax', SearchSyntaxPage, false, {}],
  ['/search', SearchPage, false, {}],
  // ['/pools', PoolsPage, true, {}],
  ['/limited/:id(\\d+)', SessionPage, false, {}],
  ['/limited', SessionsPage, false, {}],
  ['/pools/:id(\\d+)', PoolPage, false, {}],
  ['/patch/:id(\\d+)/apply', ApplyPatchPage, true, {}],
  [
    '/patch/:id(\\d+)', PatchPage, false,
    {
      render: (
        (props: any) => <PatchPage {...props} key={props.match.params.id}/>
      )
    }
  ],
  ['/wishlists/', WishListsPage, false, {}],
  ['/wishlist/:id(\\d+)/', WishListPage, false, {}],
  ['/art-game/', ArtGamePage, false, {}],
  ['/about', AboutPage, false, {}],
  [undefined, NotFoundPage, false, {}],
];
