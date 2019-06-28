from django.urls import path

from cubespoiler import views


urlpatterns = [
	path('', views.CubesView.as_view(), name='index'),
	# path('<int:cube_id>/search/', views.search_cube_view, name='cube search'),
	path('<int:cube_id>/', views.cube_view, name='cube detail'),
	path('images/<slug:pictured_id>/', views.image_view, name='image'),
	path('search/', views.SearchView.as_view(), name='search'),
	path('printing/', views.printing_view, name='printing_view'),
]