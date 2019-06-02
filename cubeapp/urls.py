from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),
    path('spoiler/', include('cubespoiler.urls')),
    path('app/', include('frontend.urls')),
    path('static/', include('statics.urls')),
]
