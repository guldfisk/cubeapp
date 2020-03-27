from django.urls import path

from draft import views


urlpatterns = [
    path('', views.DraftSessionList.as_view()),
    path('<int:pk>/', views.DraftSessionDetail.as_view()),
    # path('seat/<int:pk>/', views.SeatView.as_view()),
]
