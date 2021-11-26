from django.urls import path

from rating import views


urlpatterns = [
    path('<int:pk>/', views.RatingMapDetail.as_view()),
    path('release/<int:pk>/', views.ReleaseLatestMapDetail.as_view()),
    path('versioned-cube/<int:pk>/', views.VersionedCubeLatestMapDetail.as_view()),
    path('stats/<int:pk>/', views.RatingMapStatsView.as_view()),
    path('stats/history/<str:cardboard_id>/<int:rating_map_id>/', views.CardboardStatsHistory.as_view()),
    path(
        'example/<int:release_id>/<str:cardboard_cubeable_id>/',
        views.CardboardCubeableRatingExample.as_view(),
    ),
    path('history/<int:release_id>/<str:cardboard_id>/', views.CardboardCubeableRatingHistory.as_view()),
    path(
        'node-example/<int:release_id>/<str:node_id>/',
        views.NodeRatingComponentExample.as_view(),
    ),
    path('node-history/<int:release_id>/<str:node_id>/', views.NodeRatingComponentHistory.as_view()),
]
