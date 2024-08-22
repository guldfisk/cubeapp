from django.urls import path

from imgqty import views


urlpatterns = [
    path("<int:pk>/", views.RecordPackDetail.as_view(), name="record_detail"),
    path("release-probability-distribution/<int:pk>/<int:pack_size>/", views.ReleaseImageDistribution.as_view()),
    path("for-versioned-cube/<int:pk>/", views.RecordsForVersionedCube.as_view()),
]
