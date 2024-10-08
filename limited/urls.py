from django.urls import path

from limited import views


urlpatterns = [
    path("sessions/", views.SessionList.as_view()),
    path("sessions/<int:pk>/", views.SessionDetail.as_view()),
    path("sessions/<int:pk>/completed/", views.CompleteSession.as_view()),
    path("pools/<int:pk>/", views.PoolDetail.as_view()),
    path("pools/<int:pk>/export/", views.PoolExport.as_view()),
    path("pools/<int:pk>/share/", views.SharePool.as_view()),
    path("deck/", views.DeckList.as_view()),
    path("deck/<int:pk>/", views.DeckDetail.as_view()),
    path("deck/<int:pk>/export/", views.DeckExport.as_view()),
    path("deck/<int:pk>/sample-hand/", views.SampleHand.as_view()),
]
