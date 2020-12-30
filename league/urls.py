from django.urls import path

from league import views


urlpatterns = [
    path('', views.LeagueList.as_view()),
    path('<int:pk>/', views.LeagueDetail.as_view()),
    # path('<int:pk>/cancel/', views.TournamentCancel.as_view()),
    # path('scheduled-matches/<int:pk>/', views.ScheduledMatchDetail.as_view()),
]
