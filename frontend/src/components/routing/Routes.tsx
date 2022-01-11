import React from 'react';
import HomePage from '../pages/HomePage';

const AboutPage = React.lazy(() => import('../pages/AboutPage'));
const ApplyPatchPage = React.lazy(() => import('../pages/patches/ApplyPatchPage'));
const ArtGamePage = React.lazy(() => import('../pages/ArtGamePage'));
const CardboardDetailPage = React.lazy(() => import('../pages/ratings/CardboardDetailPage'));
const ClaimResetPage = React.lazy(() => import('../pages/authentication/ClaimResetPage'));
const CreateCubePage = React.lazy(() => import('../pages/cubes/CreateCubePage'));
const CreatePatchPage = React.lazy(() => import('../pages/patches/CreatePatchPage'));
const CubeImageRecordsPage = React.lazy(() => import('../pages/imgrecords/CubeImageRecordsPage'))
const CubePage = React.lazy(() => import('../pages/cubes/CubePage'));
const CubePatchesPage = React.lazy(() => import('../pages/patches/CubePatchesPage'));
const CubeRatingsPage = React.lazy(() => import('../pages/cubes/CubeRatingPage'));
const CubeReleaseRatingsPage = React.lazy(() => import('../pages/release/ReleaseRatingPage'));
const CubesPage = React.lazy(() => import('../pages/cubes/CubesPage'));
const DecksPage = React.lazy(() => import('../pages/limited/DecksPage'));
const DraftPage = React.lazy(() => import('../pages/draft/DraftPage'));
const DraftsPage = React.lazy(() => import('../pages/draft/DraftsPage'));
const ImageRecordPage = React.lazy(() => import('../pages/imgrecords/ImageRecordPage'))
const InvitePage = React.lazy(() => import('../pages/authentication/InvitePage'));
const KPDPage = React.lazy((() => import('../pages/kpd/KPDPage')));
const LatestPatchPage = React.lazy(() => import('../pages/patches/LatestPatchPage'));
const LatestReleasePage = React.lazy(() => import('../pages/release/LatestReleasePage'));
const LeaguePage = React.lazy(() => import('../pages/leagues/LeaguePage'));
const LeaguesPage = React.lazy(() => import('../pages/leagues/LeaguesPage'));
const MatchPage = React.lazy(() => import('../pages/tournaments/matchPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));
const PatchesPage = React.lazy(() => import('../pages/patches/PatchesPage'));
const PatchPage = React.lazy(() => import('../pages/patches/PatchPage'));
const PoolPage = React.lazy(() => import('../pages/limited/PoolPage'));
const RatedNodePage = React.lazy(() => import('../pages/ratings/RatedNodePage'));
const RatedPage = React.lazy(() => import('../pages/ratings/RatedPage'));
const RatingMapPage = React.lazy(() => import('../pages/ratings/RatingMapPage'));
const ReleaseComparePage = React.lazy(() => import('../pages/release/ReleaseComparePage'));
const ReleasePage = React.lazy(() => import('../pages/release/ReleasePage'));
const ResetPage = React.lazy(() => import('../pages/authentication/ResetPage'));
const SamplePackPage = React.lazy(() => import('../pages/release/SamplePackPage'));
const SearchPage = React.lazy(() => import('../pages/search/SearchPage'));
const SearchSyntaxPage = React.lazy(() => import('../pages/search/SearchSyntaxPage'));
const SeatPage = React.lazy(() => import('../pages/draft/SeatPage'));
const SessionPage = React.lazy(() => import('../pages/limited/SessionPage'));
const SessionsPage = React.lazy(() => import('../pages/limited/SessionsPage'));
const SignInPage = React.lazy(() => import('../pages/authentication/SignInPage'));
const SignOutPage = React.lazy(() => import('../pages/authentication/SignOutPage'));
const SignUpPage = React.lazy(() => import('../pages/authentication/SignUpPage'));
const TournamentPage = React.lazy(() => import('../pages/tournaments/tournamentPage'));
const TournamentsPage = React.lazy(() => import('../pages/tournaments/tournamentsPage'));
const UpdateTokenPage = React.lazy(() => import('../pages/kpd/UpdateTokenPage'));
const UserPage = React.lazy(() => import('../pages/users/UserPage'));
const WishListPage = React.lazy(() => import('../pages/wishes/WishListPage'));
const WishListsPage = React.lazy(() => import('../pages/wishes/WishListsPage'));
// const LobbiesPage = React.lazy(() => import('../pages/lobbies/LobbiesPage'));

export const routes: [
    string | undefined,
    (typeof React.Component) | React.FunctionComponent | any,
  boolean,
  { [key: string]: any },
][] = [
  ['/', HomePage, false, {exact: true}],
  ['/users/:id(\\d+)/', UserPage, false, {}],
  ['/cubes', CubesPage, false, {exact: true}],
  ['/cube/:id(\\d+)/patches/create', CreatePatchPage, true, {}],
  ['/cube/:id(\\d+)/patches', CubePatchesPage, false, {}],
  ['/cube/:id(\\d+)/latest-release', LatestReleasePage, false, {}],
  ['/cube/:id(\\d+)/latest-patch', LatestPatchPage, false, {}],
  [
    '/cube/:id(\\d+)', CubePage, false,
    {
      render: (
        (props: any) => <CubePage {...props} key={props.match.params.id}/>
      ),
      exact: true,
    }
  ],
  ['/cube/:id(\\d+)/ratings', CubeRatingsPage, false, {}],
  ['/cube/:id(\\d+)/image-records', CubeImageRecordsPage, false, {}],
  ['/image-record/:id(\\d+)/', ImageRecordPage, false, {}],
  [
    '/rating-map/:id(\\d+)', RatingMapPage, false,
    {
      render: (
        (props: any) => <RatingMapPage {...props} key={props.match.params.id}/>
      )
    }
  ],
  ['/release/:releaseId(\\d+)/cubeable-details/:cardboardCubeableId([^/]+)/', RatedPage, false, {}],
  ['/release/:releaseId(\\d+)/node-details/:nodeId([^/]+)/', RatedNodePage, false, {}],
  ['/release/:releaseId(\\d+)/cardboard-details/:cardboardId([^/]+)/', CardboardDetailPage, false, {}],
  ['/release/:id(\\d+)/delta-from/:id_from(\\d+)', ReleaseComparePage, false, {}],
  [
    '/release/:id(\\d+)/sample-pack/',
    SamplePackPage,
    false,
    {
      render: (
        (props: any) => <SamplePackPage {...props} key={props.location.search}/>
      )
    },
  ],
  ['/release/:id(\\d+)/ratings/', CubeReleaseRatingsPage, false, {}],
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
  ['/tournaments', TournamentsPage, false, {exact: true}],
  ['/tournaments/:id(\\d+)', TournamentPage, false, {}],
  ['/match/:id(\\d+)', MatchPage, false, {}],
  ['/leagues', LeaguesPage, false, {exact: true}],
  ['/leagues/:id(\\d+)', LeaguePage, false, {}],
  ['/drafts', DraftsPage, false, {exact: true}],
  ['/drafts/:id(\\d+)', DraftPage, false, {}],
  ['/seat/:seatId(\\d+)/:pickNumber(\\d+)', SeatPage, false, {}],
  ['/pools/:id(\\d+)', PoolPage, false, {}],
  ['/decks/', DecksPage, false, {}],
  ['/patch/:id(\\d+)/apply', ApplyPatchPage, true, {}],
  [
    '/patch/:id(\\d+)', PatchPage, false,
    {
      render: (
        (props: any) => <PatchPage {...props} key={props.match.params.id}/>
      )
    },
  ],
  ['/wishlists/', WishListsPage, false, {}],
  ['/wishlist/:id(\\d+)/', WishListPage, false, {}],
  ['/art-game/', ArtGamePage, false, {}],
  ['/about', AboutPage, false, {}],
  ['/kpd', KPDPage, false, {}],
  ['/update-token', UpdateTokenPage, true, {}],
  // ['/lobbies', LobbiesPage, true, {}],
  [null, NotFoundPage, false, {}],
];
