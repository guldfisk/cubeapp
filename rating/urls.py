from django.urls import path

from rating import views


urlpatterns = [
    path('<int:pk>/', views.RatingMapDetail.as_view()),
    path('release/<int:pk>/', views.ReleaseLatestMapDetail.as_view()),
    path('versioned-cube/<int:pk>/', views.VersionedCubeLatestMapDetail.as_view()),
    path('history/<int:pk>/<str:cardboard_id>/', views.CardboardCubeableRatingHistory.as_view()),
]
