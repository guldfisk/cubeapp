from django.urls import path

from frontend import views


urlpatterns = [
    path('', views.index),
    # path('cubeview/<int:cube_id>', views.cube_view),
]