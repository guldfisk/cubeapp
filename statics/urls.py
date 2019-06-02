from django.urls import path

from statics import views


urlpatterns = [
    path('<path:file_path>', views.static_view),
]