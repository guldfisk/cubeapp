from distutils.util import strtobool

from django.db.models import Min
from mtgorp.tools.parsing.exceptions import ParseException
from mtgorp.tools.parsing.search.parse import SearchParser
from mtgorp.tools.search.extraction import CardboardStrategy
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from resources.staticdb import db
from wishlist import models, serializers


class RequirementDetail(generics.RetrieveDestroyAPIView):
    queryset = models.Requirement.objects.all()
    serializer_class = serializers.RequirementSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class RequirementCreate(generics.CreateAPIView):
    serializer_class = serializers.RequirementSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)


class CardboardWishDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.CardboardWish.objects.all().prefetch_related("requirements")
    serializer_class = serializers.CardboardWishSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class CardboardWishCreate(generics.CreateAPIView):
    serializer_class = serializers.CardboardWishSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)


class WishDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.Wish.objects.all().prefetch_related(
        "cardboard_wishes",
        "cardboard_wishes__requirements",
    )
    serializer_class = serializers.WishSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class WishCreate(generics.CreateAPIView):
    serializer_class = serializers.WishSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)


class ListWishes(generics.ListAPIView):
    queryset = models.Wish.objects.all().prefetch_related(
        "cardboard_wishes",
    )
    serializer_class = serializers.WishSerializer

    _allowed_sort_keys = {
        "cardboards": "min_cardboard_name",
        "weight": "weight",
        "created_at": "created_at",
        "updated_at": "updated_at",
    }

    def list(self, request, *args, **kwargs):
        cardboard_filter = request.GET.get("cardboard_filter")
        if cardboard_filter:
            search_parser = SearchParser(db)
            try:
                pattern = search_parser.parse(cardboard_filter, CardboardStrategy)
            except ParseException as e:
                return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
        else:
            pattern = None

        queryset = self.filter_queryset(self.get_queryset()).filter(wish_list_id=kwargs["pk"])

        weight_filter = request.GET.get("weight_filter", "")
        if weight_filter != "":
            try:
                weight_filter = int(weight_filter)
            except ValueError:
                return Response("invalid weight filter", status=status.HTTP_400_BAD_REQUEST)
            comparator = {
                "=": "",
                "!=": None,
                "<": "__lt",
                "<=": "__lte",
                ">": "__gt",
                ">=": "__gte",
            }.get(
                request.GET.get("weight_filter_comparator"),
                "",
            )
            if comparator is None:
                queryset = queryset.exclude(weight=weight_filter)
            else:
                queryset = queryset.filter(**{"weight" + comparator: weight_filter})

        if pattern:
            queryset = queryset.filter(
                id__in=[
                    wish.id
                    for wish in queryset
                    if any(
                        pattern.match(db.cardboards[cardboard_wish.cardboard_name])
                        for cardboard_wish in wish.cardboard_wishes.all()
                    )
                ]
            )

        queryset = queryset.prefetch_related("cardboard_wishes__requirements")

        sort_key = [self._allowed_sort_keys.get(request.GET.get("sort_key"), "weight")]
        ascending = strtobool(request.GET.get("ascending", "false"))

        if sort_key[0] != self._allowed_sort_keys["cardboards"]:
            sort_key.append(self._allowed_sort_keys["cardboards"])

        if not ascending:
            sort_key[0] = "-" + sort_key[0]

        queryset = queryset.annotate(min_cardboard_name=Min("cardboard_wishes__cardboard_name")).order_by(*sort_key)

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class WishListDetail(generics.RetrieveDestroyAPIView):
    queryset = models.WishList.objects.all().prefetch_related(
        "wishes",
        "wishes__cardboard_wishes",
        "wishes__cardboard_wishes__requirements",
    )
    serializer_class = serializers.WishListSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]


class WishListList(generics.ListCreateAPIView):
    queryset = models.WishList.objects.all()
    serializer_class = serializers.WishListSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
    ]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
