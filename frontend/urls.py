from django.urls import path

from frontend import views


urlpatterns = [
    path('', views.index),
    path('cubeview/', views.cube_view),
]