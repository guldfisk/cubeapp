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
import TestPage from "../pages/TestPage";
import AboutPage from "../pages/AboutPage";
import ReleaseComparePage from "../pages/ReleaseComparePage";
import LatestReleasePage from "../pages/LatestReleasePage";


// class RouteModel {
//   _relative_path: string;
//   _parent: RouteModel | null;
//   component: (typeof React.Component) | React.FunctionComponent;
//   isPrivate: boolean;
//   _children: RouteModel[];
//
//   constructor(
//     relative_path: string,
//     component: (typeof React.Component) | React.FunctionComponent,
//     isPrivate: boolean,
//     children: RouteModel[] = [],
//     parent: RouteModel | null = null,
//   ) {
//     this._relative_path = relative_path;
//     this._parent = parent;
//     this.component = component;
//     this.isPrivate = isPrivate;
//     this._children = children;
//
//     children.forEach(
//       child => {
//         child._parent = this
//       }
//     );
//   }
//
//   path = (): string => {
//     return this._parent === null ?
//       this._relative_path
//       : this._parent.path() + this._relative_path
//   };
//
//   populatedPath = (params: Object) => {
//     return Object.entries(params).reduce(
//       (replaced: string, [key, value]: [string, string]) => replaced.replace(
//         new RegExp(':' + key + '\(.*\)'),
//         value,
//       ),
//       this.path(),
//     )
//   };
//
//   * family(): IterableIterator<RouteModel> {
//     yield this;
//     for (const child of this._children) {
//       yield* child.family();
//     }
//   };
//
//   * trail(params: Object): IterableIterator<string> {
//     if (this._parent !== null) {
//       yield* this._parent.trail(params);
//     }
//     yield this.populatedPath(params);
//
//   };
//
//   BreadcrumbTrail = (props: any) => {
//     return <Breadcrumb>
//       {
//         Array.from(this.trail(props.match.params)).map(
//           (path: string) => <Breadcrumb.Item>{path}</Breadcrumb.Item>
//         )
//       }
//     </Breadcrumb>;
//   };
//
// }
//
//
// const routeModel = new RouteModel(
//   '/',
//   CubesPage,
//   false,
//   [
//
//   ]
// );


export const routes: [string | undefined, (typeof React.Component) | React.FunctionComponent, boolean, object][] = [
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
  ['/patch/:id(\\d+)/apply', ApplyPatchPage, true, {}],
  ['/patch/:id(\\d+)', PatchPage, false, {}],
  ['/test', TestPage, false, {}],
  ['/about', AboutPage, false, {}],
  [undefined, NotFoundPage, false, {}],
];
