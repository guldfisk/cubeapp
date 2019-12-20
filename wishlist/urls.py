from django.urls import path

from sealed import views


urlpatterns = [
    path('<str:key>/', views.PoolDetail.as_view()),
]