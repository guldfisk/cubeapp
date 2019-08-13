from django.urls import path

from api import views


urlpatterns = [
	path('', views.CubeReleasesList.as_view(), name='index'),

	path('cube-releases/', views.CubeReleasesList.as_view()),
	path('cube-releases/<int:pk>/', views.CubeReleaseView.as_view()),
	path('cube-releases/<int:pk>/filter/', views.filter_release_view),

	path('images/<slug:pictured_id>/', views.image_view, name='image'),
	path('search/', views.SearchView.as_view(), name='search'),
	path('printing/', views.printing_view, name='printing_view'),

	path('auth/login/', views.LoginEndpoint.as_view(), name='login_endpoint'),
	path('auth/signup/', views.SignupEndpoint.as_view(), name='signup_endpoint'),
	path('auth/invite/', views.InviteUserEndpoint.as_view(), name='invite_endpoint'),
	path('auth/user/', views.UserEndpoint.as_view(), name='user_endpoint'),

	path('versioned-cubes/', views.VersionedCubesList.as_view()),
	path('versioned-cubes/<int:pk>/', views.VersionedCubeDetail.as_view()),
	path('versioned-cubes/<int:pk>/patches/', views.VersionedCubePatchList.as_view()),

	path('users/', views.UserList.as_view()),
	path('users/<int:pk>/', views.UserDetail.as_view()),

	path('patches/', views.PatchList.as_view()),
	path('patches/<int:pk>/', views.PatchDetail.as_view()),
	path('patches/<int:pk>/preview/', views.patch_preview),
	path('patches/<int:pk>/apply/', views.ApplyPatchEndpoint.as_view()),

	path('service/parse-trap/', views.ParseTrapEndpoint.as_view()),
	path('service/parse-constrained-node/', views.ParseConstrainedNodeEndpoint.as_view()),

	path('constrained-nodes/', views.ConstrainedNodesList.as_view()),

]