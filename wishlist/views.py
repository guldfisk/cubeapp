from rest_framework import generics

from wishlist import models, serializers


class RequirementDetail(generics.RetrieveDestroyAPIView):
    queryset = models.Requirement.objects.all()
    serializer_class = serializers.RequirementSerializer


class RequirementCreate(generics.CreateAPIView):
    serializer_class = serializers.RequirementSerializer


class CardboardWishDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.CardboardWish.objects.all()
    serializer_class = serializers.CardboardWishSerializer


class CardboardWishCreate(generics.CreateAPIView):
    serializer_class = serializers.CardboardWishSerializer


class WishDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.Wish.objects.all()
    serializer_class = serializers.WishSerializer


class WishCreate(generics.CreateAPIView):
    serializer_class = serializers.WishSerializer


class WishListDetail(generics.RetrieveDestroyAPIView):
    queryset = models.WishList.objects.all()
    serializer_class = serializers.WishListSerializer
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class WishListList(generics.ListCreateAPIView):
    queryset = models.WishList.objects.all()
    serializer_class = serializers.WishListSerializer