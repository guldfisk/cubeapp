from django.urls import path, include, re_path


urlpatterns = [
    path('api/', include('api.urls')),
    path('api/auth/', include('knox.urls')),
    path('api/sealed/', include('sealed.urls')),
    re_path('.*', include('frontend.urls')),
]
