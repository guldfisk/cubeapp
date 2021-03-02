import React from 'react';
import HomePage from "../pages/HomePage";

const ReleasePage = React.lazy(() => import('../pages/release/ReleasePage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));
const CreateCubePage = React.lazy(() => import('../pages/cubes/CreateCubePage'));
const CubePatchesPage = React.lazy(() => import('../pages/patches/CubePatchesPage'));
const SignInPage = React.lazy(() => import('../pages/authentication/SignInPage'));
const ResetPage = React.lazy(() => import('../pages/authentication/ResetPage'));
const ClaimResetPage = React.lazy(() => import('../pages/authentication/ClaimResetPage'));
const SignOutPage = React.lazy(() => import('../pages/authentication/SignOutPage'));
const CubesPage = React.lazy(() => import('../pages/cubes/CubesPage'));
const CubePage = React.lazy(() => import('../pages/cubes/CubePage'));
const PatchesPage = React.lazy(() => import('../pages/patches/PatchesPage'));
const PatchPage = React.lazy(() => import('../pages/patches/PatchPage'));
const CreatePatchPage = React.lazy(() => import('../pages/patches/CreatePatchPage'));
const SignUpPage = React.lazy(() => import("../pages/authentication/SignUpPage"));
const InvitePage = React.lazy(() => import("../pages/authentication/InvitePage"));
const ApplyPatchPage = React.lazy(() => import("../pages/patches/ApplyPatchPage"));
const AboutPage = React.lazy(() => import("../pages/AboutPage"));
const ReleaseComparePage = React.lazy(() => import("../pages/release/ReleaseComparePage"));
const LatestReleasePage = React.lazy(() => import("../pages/release/LatestReleasePage"));
const SearchSyntaxPage = React.lazy(() => import("../pages/search/SearchSyntaxPage"));
const SearchPage = React.lazy(() => import("../pages/search/SearchPage"));
const SamplePackPage = React.lazy(() => import("../pages/release/SamplePackPage"));
const WishListPage = React.lazy(() => import("../pages/wishes/WishListPage"));
const WishListsPage = React.lazy(() => import("../pages/wishes/WishListsPage"));
const PoolPage = React.lazy(() => import("../pages/limited/PoolPage"));
const DecksPage = React.lazy(() => import("../pages/limited/DecksPage"));
const SessionsPage = React.lazy(() => import("../pages/limited/SessionsPage"));
const SessionPage = React.lazy(() => import("../pages/limited/SessionPage"));
const ArtGamePage = React.lazy(() => import("../pages/ArtGamePage"));
const DraftsPage = React.lazy(() => import("../pages/draft/DraftsPage"));
const DraftPage = React.lazy(() => import("../pages/draft/DraftPage"));
const SeatPage = React.lazy(() => import("../pages/draft/SeatPage"));
const TournamentPage = React.lazy(() => import("../pages/tournaments/tournamentPage"));
const TournamentsPage = React.lazy(() => import("../pages/tournaments/tournamentsPage"));
const MatchPage = React.lazy(() => import("../pages/tournaments/matchPage"));
const LeaguePage = React.lazy(() => import("../pages/leagues/LeaguePage"));
const LeaguesPage = React.lazy(() => import("../pages/leagues/LeaguesPage"));
const UserPage = React.lazy(() => import("../pages/users/UserPage"));
const CubeRatingsPage = React.lazy(() => import("../pages/cubes/RatingPage"));


export const routes: [
    string | undefined,
    (typeof React.Component) | React.FunctionComponent | any,
  boolean,
  { [key: string]: any }
][] = [
  ['/', HomePage, false, {exact: true}],
  ['/users/:id(\\d+)/', UserPage, false, {}],
  ['/cubes', CubesPage, false, {}],
  ['/cube/:id(\\d+)/patches/create', CreatePatchPage, true, {}],
  ['/cube/:id(\\d+)/patches', CubePatchesPage, false, {}],
  ['/cube/:id(\\d+)/latest-release', LatestReleasePage, false, {}],
  [
    '/cube/:id(\\d+)', CubePage, false,
    {
      render: (
        (props: any) => <CubePage {...props} key={props.match.params.id}/>
      )
    }
  ],
  ['/cube/:id(\\d+)/ratings', CubeRatingsPage, false, {}],
  ['/release/:id(\\d+)/delta-from/:id_from(\\d+)', ReleaseComparePage, false, {}],
  ['/release/:id(\\d+)/sample-pack/', SamplePackPage, false, {}],
  ['/release/:id(\\d+)', ReleasePage, false, {}],
  ['/login', SignInPage, false, {}],
  ['/reset-password', ResetPage, false, {}],
  ['/claim-password-reset', ClaimResetPage, false, {}],
  ['/invite', InvitePage, true, {}],
  ['/logout', SignOutPage, false, {}],
  ['/sign-up', SignUpPage, false, {}],
  ['/create-cube', CreateCubePage, true, {}],
  ['/patches', PatchesPage, false, {}],
  ['/syntax', SearchSyntaxPage, false, {}],
  ['/search', SearchPage, false, {}],
  ['/limited/:id(\\d+)', SessionPage, false, {}],
  ['/limited', SessionsPage, false, {}],
  ['/tournaments', TournamentsPage, false, {}],
  ['/tournaments/:id(\\d+)', TournamentPage, false, {}],
  ['/match/:id(\\d+)', MatchPage, false, {}],
  ['/leagues', LeaguesPage, false, {}],
  ['/leagues/:id(\\d+)', LeaguePage, false, {}],
  ['/drafts', DraftsPage, false, {}],
  ['/drafts/:id(\\d+)', DraftPage, false, {}],
  ['/seat/:id(\\d+)/:seat(\\d+)', SeatPage, false, {}],
  ['/pools/:id(\\d+)', PoolPage, false, {}],
  ['/decks/', DecksPage, false, {}],
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
