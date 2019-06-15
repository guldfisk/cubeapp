from django.urls import path

from cubespoiler import views


urlpatterns = [
	path('', views.index, name='index'),
	path('<int:cube_id>/', views.cube_view, name='_cube detail'),
	path('images/<slug:pictured_id>/', views.image_view, name='image'),
]