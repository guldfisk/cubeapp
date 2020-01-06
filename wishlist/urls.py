from django.urls import path

from wishlist import views


urlpatterns = [

    path('', views.WishListList.as_view()),
    path('<int:pk>/', views.WishListDetail.as_view()),

    path('wish/', views.WishCreate.as_view()),
    path('wish/<int:pk>/', views.WishDetail.as_view()),

    path('cardboard-wish/', views.CardboardWishCreate.as_view()),
    path('cardboard-wish/<int:pk>/', views.CardboardWishDetail.as_view()),

    path('requirement/', views.RequirementCreate.as_view()),
    path('requirement/<int:pk>/', views.RequirementDetail.as_view()),

]