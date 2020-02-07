from django.urls import path

from sealed import views


urlpatterns = [
    path('pools/', views.PoolList.as_view()),
    path('<str:key>/', views.PoolDetail.as_view()),
]