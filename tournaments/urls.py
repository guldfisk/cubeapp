from django.urls import path

from tournaments import views


urlpatterns = [
    path('', views.TournamentList.as_view()),
    path('<int:pk>/', views.TournamentDetail.as_view()),
    path('<int:pk>/cancel/', views.TournamentCancel.as_view()),
    path('scheduled-matches/<int:pk>/', views.ScheduledMatchDetail.as_view()),
    path('users/<int:pk>/scheduled-matches/', views.UserScheduledMatches.as_view()),
]
