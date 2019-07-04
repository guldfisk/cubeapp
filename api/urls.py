from django.urls import path

from api import views


urlpatterns = [
	path('', views.CubesView.as_view(), name='index'),
	# path('<int:cube_id>/search/', views.search_cube_view, name='cube search'),
	path('cube-releases/', views.CubesView.as_view()),
	path('cube-releases/<int:cube_id>/', views.cube_view),

	path('images/<slug:pictured_id>/', views.image_view, name='image'),
	path('search/', views.SearchView.as_view(), name='search'),
	path('printing/', views.printing_view, name='printing_view'),

	path('auth/login/', views.LoginEndpoint.as_view(), name='login_endpoint'),
	path('auth/user/', views.UserEndpoint.as_view(), name='user_endpoint'),

	path('versioned-cubes/', views.VersionedCubesList.as_view()),
	path('versioned-cubes/<int:pk>/', views.VersionedCubeDetail.as_view()),

	path('users/', views.UserList.as_view()),
	path('users/<int:pk>/', views.UserDetail.as_view()),
]