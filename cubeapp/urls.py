from django.contrib import admin
from django.urls import path, include, re_path

from cubeapp import views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('template_test/', views.test_view),
    path('api/', include('api.urls')),
    path('api/auth/', include('knox.urls')),
    re_path('.*', include('frontend.urls')),
]
