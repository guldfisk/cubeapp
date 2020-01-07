from rest_framework import generics, permissions

from wishlist import models, serializers


class RequirementDetail(generics.RetrieveDestroyAPIView):
    queryset = models.Requirement.objects.all()
    serializer_class = serializers.RequirementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class RequirementCreate(generics.CreateAPIView):
    serializer_class = serializers.RequirementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class CardboardWishDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.CardboardWish.objects.all().select_related('requirements')
    serializer_class = serializers.CardboardWishSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class CardboardWishCreate(generics.CreateAPIView):
    serializer_class = serializers.CardboardWishSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class WishDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.Wish.objects.all().prefetch_related(
        'cardboard_wishes',
        'cardboard_wishes__requirements',
    )
    serializer_class = serializers.WishSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class WishCreate(generics.CreateAPIView):
    serializer_class = serializers.WishSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class WishListDetail(generics.RetrieveDestroyAPIView):
    queryset = models.WishList.objects.all().prefetch_related(
        'wishes',
        'wishes__cardboard_wishes',
        'wishes__cardboard_wishes__requirements',
    )
    serializer_class = serializers.WishListSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]


class WishListList(generics.ListCreateAPIView):
    queryset = models.WishList.objects.all().prefetch_related(
        'wishes',
        'wishes__cardboard_wishes',
        'wishes__cardboard_wishes__requirements',
    )
    serializer_class = serializers.WishListSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, ]
