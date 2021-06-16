from django.urls import path

from kpd import views


urlpatterns = [
    path('points/', views.PointList.as_view()),
]
