from django.contrib import admin
from django.urls import path, include, re_path


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/auth/', include('knox.urls')),
    path('static/', include('statics.urls')),
    re_path('.*', include('frontend.urls')),
]
