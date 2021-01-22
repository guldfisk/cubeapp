from django.urls import path

from league import views


urlpatterns = [
    path('', views.LeagueList.as_view()),
    path('<int:pk>/', views.LeagueDetail.as_view()),
    path('<int:pk>/eligibles/', views.LeagueEligibles.as_view()),
    path('<int:pk>/seasons/', views.LeagueSeasons.as_view()),
]
