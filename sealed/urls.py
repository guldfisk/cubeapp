from django.urls import path

from sealed import views


urlpatterns = [
    path('sessions/', views.SessionList.as_view()),
    path('sessions/<int:pk>/', views.SessionDetail.as_view()),
    # path('pools/', views.PoolList.as_view()),
    path('<str:key>/', views.PoolDetail.as_view()),
    path('decks/<int:pk>/', views.DeckDetail.as_view()),
]