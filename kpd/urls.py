from django.urls import path

from kpd import views


urlpatterns = [
    path('points/', views.PointList.as_view()),
    path('get-authentication-link/', views.GetAuthenticationLink.as_view()),
    path('create-session/<str:code>/', views.CreateSession.as_view()),
]
