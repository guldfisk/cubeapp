from django.contrib import admin
from django.urls import path, include

from cubeapp import views


urlpatterns = [
    path('', views.index),
    path('admin/', admin.site.urls),
    path('spoiler/', include('cubespoiler.urls')),
    path('app/', include('frontend.urls')),
    path('static/', include('statics.urls')),
]
